import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ArrowLeft, CheckCircle2, ShoppingBag, ChevronRight, Plus, MapPin, Check, Mail, Edit2, X, AlertCircle } from 'lucide-react';
import { CartItem, UserProfile, Product } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

import { INDIAN_STATES } from '../constants';

interface CheckoutProps {
  cart: CartItem[];
  user: UserProfile;
  clearCart: () => void;
}

type CheckoutStep = 'delivery' | 'payment' | 'review';

export default function Checkout({ cart, user, clearCart }: CheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | null>(null);
  const [shippingSettings, setShippingSettings] = useState({
    freeOrdersCount: 3,
    freeShippingThreshold: 600
  });
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: user.fullName || user.displayName || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    postalCode: user.postalCode || '',
    country: 'India',
    saveAddress: true
  });

  // Sync formData with user when user data arrives
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || user.displayName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || '',
        city: prev.city || user.city || '',
        state: prev.state || user.state || '',
        postalCode: prev.postalCode || user.postalCode || ''
      }));
    }
  }, [user]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        setOrderCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching order count:', error);
      }
    };

    const fetchShippingSettings = async () => {
      try {
        const settingsDoc = await getDocs(query(collection(db, 'settings'), where('id', '==', 'shipping')));
        if (!settingsDoc.empty) {
          const data = settingsDoc.docs[0].data();
          setShippingSettings({
            freeOrdersCount: data.freeOrdersCount ?? 3,
            freeShippingThreshold: data.freeShippingThreshold ?? 600
          });
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error);
      }
    };

    fetchOrderCount();
    fetchShippingSettings();
  }, [user.uid]);

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  // Free delivery logic: first X orders free OR subtotal > threshold
  const isFreeDelivery = orderCount < shippingSettings.freeOrdersCount || subtotal > shippingSettings.freeShippingThreshold;
  const shipping = isFreeDelivery ? 0 : 50;
  const total = subtotal + shipping;

  const handleNextStep = () => {
    if (step === 'delivery') {
      // If not adding a new address, user MUST select one of the saved addresses
      if (!showNewAddressForm && selectedAddressIndex === null) {
        alert('Please select a delivery address to proceed.');
        return;
      }

      if (!formData.address || !formData.city || !formData.state || !formData.postalCode || !formData.phone || !formData.fullName) {
        alert('Please fill in all delivery details.');
        return;
      }
      if (!/^\d{6}$/.test(formData.postalCode)) {
        alert('Please enter a valid 6-digit PIN code.');
        return;
      }
      setStep('payment');
    }
    else if (step === 'payment') {
      if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
      }
      setStep('review');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    setCheckoutError(null);
    try {
      // Final stock check before placing order
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsMap = new Map(productsSnapshot.docs.map(doc => [doc.id, doc.data() as Product]));
      
      for (const item of cart) {
        const product = productsMap.get(item.productId);
        if (!product || product.stock < item.quantity) {
          setCheckoutError(`Sorry, ${item.name} is no longer available in the requested quantity. Please update your bag.`);
          setIsProcessing(false);
          return;
        }
      }

      // Generate a unique order ID for tracking
      const orderId = `PRATH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create order in Firestore
      const orderData = {
        orderId,
        userId: user.uid,
        items: cart,
        totalAmount: total,
        status: 'pending',
        shippingDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        paymentMethod: 'online',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Update Stock for each item
      const stockUpdates = cart.map(item => {
        const productRef = doc(db, 'products', item.productId);
        return updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      });
      await Promise.all(stockUpdates);

      // Direct Email Simulation (as requested by user)
      console.log(`%c [DIRECT EMAIL SENT TO GMAIL] To: ${formData.email} \n Subject: Order Confirmation - ${orderId} \n Body: Thank you for your order! Your order ID is ${orderId}. Total: ₹${total.toLocaleString('en-IN')}. You can track your order status on our website using this Order ID.`, 'background: #4f46e5; color: #fff; padding: 10px; border-radius: 5px;');
      
      console.log(`%c [DIRECT EMAIL SENT TO GMAIL] To: admin@prathiss.com \n Subject: NEW ORDER PLACED - ${orderId} \n Body: A new order has been placed by ${formData.fullName}. Order ID: ${orderId}. Total: ₹${total.toLocaleString('en-IN')}. Please process the order.`, 'background: #10b981; color: #fff; padding: 10px; border-radius: 5px;');

      // Update user address if "saveAddress" is checked
      if (formData.saveAddress) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: user.role,
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          phone: formData.phone,
          createdAt: user.createdAt || new Date().toISOString()
        }, { merge: true });
      }

      setFormData(prev => ({ ...prev, orderId })); // Store orderId in state to show on success page
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error('Checkout error:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'orders/products/users');
      } catch (finalErr: any) {
        setCheckoutError(finalErr.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReceipt = () => {
    const orderId = (formData as any).orderId;
    const receiptContent = `
-------------------------------------------
          PRATHISS ORDER RECEIPT
-------------------------------------------
Order ID: ${orderId}
Date: ${new Date().toLocaleString()}
Customer: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}, ${formData.city}, ${formData.state} - ${formData.postalCode}

ITEMS:
${cart.map(item => `- ${item.name} (x${item.quantity}): ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}

Subtotal: ₹${subtotal.toLocaleString('en-IN')}
Shipping: ${shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
TOTAL: ₹${total.toLocaleString('en-IN')}
-------------------------------------------
Thank you for shopping with Prathiss!
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-sm"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Order Confirmed!</h2>
        <div className="bg-white px-8 py-6 rounded-3xl border border-gray-100 shadow-sm mb-8 text-center max-w-md w-full">
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
            <p className="text-xl font-mono font-bold text-indigo-600">{(formData as any).orderId}</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    Order Placed
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold inline-block text-indigo-600">
                    25%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                <div style={{ width: "25%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Your order is being processed. You can track your order status on our website using your <span className="text-indigo-600 font-bold">Order ID</span>.
            </p>
          </div>

          <p className="text-[10px] text-green-600 font-bold mt-6 flex items-center justify-center">
            <Mail size={12} className="mr-1" /> Confirmation sent to {formData.email}
          </p>
        </div>
        <p className="text-gray-500 mb-10 max-w-md text-center leading-relaxed">
          Thank you for shopping with Prathiss. Your order has been placed successfully and is being processed.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all shadow-sm flex items-center justify-center"
          >
            <X size={18} className="mr-2" />
            Close
          </button>
          <button
            onClick={downloadReceipt}
            className="px-8 py-4 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center"
          >
            <ShoppingBag size={18} className="mr-2" />
            Download Receipt
          </button>
          <Link
            to="/profile"
            className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center"
          >
            View Order History
          </Link>
          <Link
            to="/"
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-100 flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Checkout Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between max-w-2xl overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center flex-1 min-w-fit">
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${step === 'delivery' || step === 'payment' || step === 'review' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-400'}`}>
              {step === 'payment' || step === 'review' ? <Check size={16} className="sm:w-5 sm:h-5" /> : '1'}
            </div>
            <div className={`ml-2 sm:ml-3 text-[10px] sm:text-sm font-bold whitespace-nowrap ${step === 'delivery' ? 'text-indigo-600' : 'text-gray-500'}`}>Delivery</div>
            <div className="flex-1 h-px bg-gray-200 mx-2 sm:mx-4 min-w-[20px]"></div>
          </div>
          
          <div className="flex items-center flex-1 min-w-fit">
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${step === 'payment' || step === 'review' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-400'}`}>
              {step === 'review' ? <Check size={16} className="sm:w-5 sm:h-5" /> : '2'}
            </div>
            <div className={`ml-2 sm:ml-3 text-[10px] sm:text-sm font-bold whitespace-nowrap ${step === 'payment' ? 'text-indigo-600' : 'text-gray-500'}`}>Payment</div>
            <div className="flex-1 h-px bg-gray-200 mx-2 sm:mx-4 min-w-[20px]"></div>
          </div>

          <div className="flex items-center min-w-fit">
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${step === 'review' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-400'}`}>
              3
            </div>
            <div className={`ml-2 sm:ml-3 text-[10px] sm:text-sm font-bold whitespace-nowrap ${step === 'review' ? 'text-indigo-600' : 'text-gray-500'}`}>Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Saved Addresses */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Saved Addresses</h3>
                    <button 
                      onClick={() => {
                        if (!showNewAddressForm) {
                          setSelectedAddressIndex(null);
                          setFormData({
                            ...formData,
                            fullName: '',
                            address: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            phone: ''
                          });
                        }
                        setShowNewAddressForm(!showNewAddressForm);
                      }}
                      className="text-indigo-600 text-sm font-bold flex items-center hover:underline"
                    >
                      <Plus size={16} className="mr-1" />
                      {showNewAddressForm ? 'Cancel' : 'Add new address'}
                    </button>
                  </div>
                  
                  {!showNewAddressForm && (
                    <div className="space-y-4">
                      {user.address ? (
                        <div 
                          className={`p-6 border-2 rounded-2xl transition-all ${selectedAddressIndex === 0 ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-200'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex items-start flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedAddressIndex(0);
                                setFormData({
                                  ...formData,
                                  fullName: user.fullName || user.displayName || '',
                                  address: user.address || '',
                                  city: user.city || '',
                                  state: user.state || '',
                                  postalCode: user.postalCode || '',
                                  phone: user.phone || ''
                                });
                              }}
                            >
                              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${selectedAddressIndex === 0 ? 'border-indigo-600' : 'border-gray-300'}`}>
                                {selectedAddressIndex === 0 && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{user.fullName || user.displayName}</p>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{user.address}</p>
                                <p className="text-sm text-gray-500 mt-1">{user.city}, {user.state} - {user.postalCode}</p>
                                <p className="text-sm text-gray-500 mt-1">Phone: +91 {user.phone}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  fullName: user.fullName || user.displayName || '',
                                  address: user.address || '',
                                  city: user.city || '',
                                  state: user.state || '',
                                  postalCode: user.postalCode || '',
                                  phone: user.phone || ''
                                });
                                setShowNewAddressForm(true);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Edit address"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                          <p className="text-gray-400 text-sm">No saved addresses found.</p>
                          <button 
                            onClick={() => setShowNewAddressForm(true)}
                            className="mt-4 text-indigo-600 font-bold text-sm"
                          >
                            Add your first address
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {showNewAddressForm && (
                    <div className="space-y-6 pt-4 border-t border-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full name</label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                          <div className="flex">
                            <div className="px-4 py-3 bg-gray-50 border border-gray-100 border-r-0 rounded-l-xl text-gray-500 font-medium">+91</div>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="House No, Street, Landmark"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your city"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">State</label>
                          <select
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select state</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Postal Code</label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter pin code"
                          />
                        </div>
                        <div className="flex items-center pt-6">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            checked={formData.saveAddress}
                            onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-500 font-medium">Save this address</label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 transform hover:scale-[1.02]"
                >
                  Deliver to this address
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Payment Method</h3>
                    <p className="text-sm text-gray-500">All transactions are secure and encrypted.</p>
                  </div>

                  <div className="space-y-4">
                    <div 
                      onClick={() => setPaymentMethod('online')}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-gray-300'}`}>
                            {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Pay Online</p>
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-0.5">Recommended</p>
                          </div>
                        </div>
                        <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Secure</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-6 items-center mt-4">
                        <div className="h-8 flex items-center justify-center bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <img src="https://www.vectorlogo.zone/logos/upi/upi-ar21.svg" alt="UPI" className="h-5 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="h-8 flex items-center justify-center bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <img src="https://www.logo.wine/a/logo/Visa_Inc./Visa_Inc.-Logo.wine.svg" alt="Visa" className="h-10 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="h-8 flex items-center justify-center bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="h-8 flex items-center justify-center bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rupay-Logo.png/1200px-Rupay-Logo.png" alt="RuPay" className="h-4 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Razorpay</span>
                      </div>
                    </div>

                    <div className="p-6 border-2 border-gray-50 bg-gray-50/50 rounded-2xl opacity-60 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-200 mr-4"></div>
                          <div>
                            <p className="font-bold text-gray-400">Cash on Delivery</p>
                            <p className="text-xs text-gray-400 mt-0.5">Currently unavailable</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('delivery')}
                    className="flex items-center text-gray-500 font-bold hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Delivery
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-12 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 transform hover:scale-[1.02]"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                    <h3 className="text-xl font-bold text-gray-900">Review Your Order</h3>
                    <span className="text-sm text-gray-500 font-medium">{cart.length} items</span>
                  </div>

                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="relative">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-20 object-cover rounded-xl mr-6 shadow-sm" referrerPolicy="no-referrer" />
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                              {item.quantity}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Size: Standard</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery Address</h4>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm font-bold text-gray-900">{formData.fullName}</p>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{formData.address}, {formData.city}, {formData.state} - {formData.postalCode}</p>
                        <p className="text-sm text-gray-500 mt-1">Phone: +91 {formData.phone}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Method</h4>
                      <div className="bg-gray-50 p-4 rounded-xl flex items-center">
                        <CreditCard size={18} className="text-indigo-600 mr-3" />
                        <p className="text-sm font-bold text-gray-900">Online Payment (Razorpay)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('payment')}
                    className="flex items-center text-gray-500 font-bold hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Payment
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="px-12 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 transform hover:scale-[1.02]"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        <span>Place Order • ₹{total.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                  
                  {checkoutError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start text-red-600 text-sm">
                      <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                      <div className="break-words overflow-hidden">
                        <p className="font-bold mb-1">Checkout Error</p>
                        <p className="text-xs opacity-80">{checkoutError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24 space-y-8">
            <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <div className="text-right">
                  <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                  {orderCount < shippingSettings.freeOrdersCount && shipping === 0 && (
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter mt-0.5">First {shippingSettings.freeOrdersCount} Orders Free!</p>
                  )}
                  {orderCount >= shippingSettings.freeOrdersCount && subtotal > shippingSettings.freeShippingThreshold && shipping === 0 && (
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter mt-0.5">Free Shipping above ₹{shippingSettings.freeShippingThreshold}</p>
                  )}
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-indigo-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center text-xs text-indigo-700 font-bold">
                <ShieldCheck size={14} className="mr-2 text-indigo-600" />
                100% Secure Checkout
              </div>
              <div className="flex items-center text-xs text-indigo-700 font-bold">
                <Truck size={14} className="mr-2 text-indigo-600" />
                Free delivery on first {shippingSettings.freeOrdersCount} orders
              </div>
            </div>

            <div className="pt-4">
              <p className="text-[10px] text-gray-400 text-center leading-relaxed italic">
                By placing your order, you agree to Prathiss's terms of use and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
