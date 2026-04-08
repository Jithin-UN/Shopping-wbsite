import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Phone, Package, Clock, ChevronRight, ShoppingBag, LogOut, Mail, ShieldCheck, AlertCircle, Heart, ArrowRight, Building2, Landmark, Hash, Bell, CheckCircle2, Info, Truck, Trash2, Download } from 'lucide-react';
import { UserProfile, Order, Notification } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { signOut, sendEmailVerification, updateProfile } from 'firebase/auth';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { INDIAN_STATES } from '../constants';

interface ProfileProps {
  user: UserProfile;
}

export default function Profile({ user }: ProfileProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || user.displayName || '');
  const [address, setAddress] = useState(user.address || '');
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [postalCode, setPostalCode] = useState(user.postalCode || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPerPage = 5;
  const navigate = useNavigate();

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleString();
    if (date.toDate) return date.toDate().toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    if (!isEditing) {
      setFullName(user.fullName || user.displayName || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setPostalCode(user.postalCode || '');
      setPhone(user.phone || '');
    }
  }, [user, isEditing]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendVerification = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    try {
      setVerificationError('');
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      setCooldown(60); // 60 seconds cooldown
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error.code === 'auth/too-many-requests') {
        setVerificationError('Too many requests. Please wait a minute before trying again.');
        setCooldown(60);
      } else {
        setVerificationError(error.message || 'Failed to send verification email.');
      }
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      }) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const totalOrderPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const downloadOrderReceipt = (order: Order) => {
    const receiptContent = `
-------------------------------------------
          PRATHISS ORDER RECEIPT
-------------------------------------------
Order ID: ${order.orderId}
Date: ${new Date(order.createdAt).toLocaleString()}
Status: ${order.status.toUpperCase()}
-------------------------------------------
CUSTOMER DETAILS:
Name: ${order.shippingDetails.fullName}
Email: ${order.shippingDetails.email}
Phone: ${order.shippingDetails.phone}
Address: ${order.shippingDetails.address}
City: ${order.shippingDetails.city}
State: ${order.shippingDetails.state}
PIN Code: ${order.shippingDetails.postalCode}
Country: ${order.shippingDetails.country}
-------------------------------------------
ORDER ITEMS:
${order.items.map(item => `- ${item.name} (x${item.quantity}): ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}

Subtotal: ₹${(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0)).toLocaleString('en-IN')}
TOTAL AMOUNT: ₹${order.totalAmount.toLocaleString('en-IN')}
Payment Method: ${order.paymentMethod.toUpperCase()}
-------------------------------------------
Thank you for shopping with Prathiss!
-------------------------------------------
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${order.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postalCode && !/^\d{6}$/.test(postalCode)) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }

      // Update Firestore Document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: user.role,
        fullName,
        displayName: fullName, // Keep displayName in sync in Firestore too
        address,
        city,
        state,
        postalCode,
        phone,
        createdAt: user.createdAt || new Date().toISOString()
      }, { merge: true });
      
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-indigo-100">
              {user.displayName?.[0] || user.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{fullName || user.displayName || 'User'}</h1>
              <p className="text-gray-500 font-medium">{user.email}</p>
              <div className="flex items-center mt-3 space-x-3">
                {auth.currentUser?.emailVerified ? (
                  <span className="flex items-center px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    <ShieldCheck size={12} className="mr-1" /> Verified Account
                  </span>
                ) : (
                  <button 
                    onClick={handleSendVerification}
                    disabled={cooldown > 0}
                    className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-yellow-100 transition-colors"
                  >
                    <AlertCircle size={12} className="mr-1" /> Verify Email {cooldown > 0 && `(${cooldown}s)`}
                  </button>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-indigo-100 transition-colors">
                    <ShieldCheck size={12} className="mr-1" /> Admin Access
                  </Link>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} className="mr-2" /> Logout
          </button>
        </div>

        <div className="px-8 border-t border-gray-50 flex items-center space-x-8">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'profile' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'orders' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar - Stats & Navigation */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <User size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{fullName || user.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <Link to="/favorites" className="flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-100 transition-all group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider">Wishlist</h4>
                  <p className="text-[10px] text-red-400 font-bold">{user.favorites?.length || 0} Items</p>
                </div>
              </div>
              <ArrowRight size={18} />
            </Link>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-bold text-gray-900">{orders.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'orders' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Order History</h2>
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 text-sm font-bold text-gray-500 shadow-sm">
                  {orders.length} Orders
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {paginatedOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                            <p className="text-sm font-mono font-bold text-gray-900">{order.orderId}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</p>
                            <p className="text-sm font-bold text-gray-900">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="text-sm font-bold text-indigo-600 font-mono">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => downloadOrderReceipt(order)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Download size={18} />
                            </button>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                              order.status === 'completed' ? 'bg-green-50 text-green-600' :
                              order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                              'bg-yellow-50 text-yellow-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50/50">
                        {order.status !== 'delivered' && order.status !== 'completed' ? (
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Progress</p>
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{order.status}</p>
                            </div>
                            <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-1000"
                                style={{ 
                                  width: order.status === 'pending' ? '25%' : 
                                         order.status === 'processing' ? '50%' : 
                                         order.status === 'shipped' ? '75%' : '0%' 
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-6 flex items-center space-x-2 text-green-600">
                            <CheckCircle2 size={16} />
                            <p className="text-xs font-bold uppercase tracking-widest">Delivered Successfully</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                              <div className="pr-2">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {totalOrderPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Page {ordersPage} of {totalOrderPages}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          disabled={ordersPage === 1}
                          onClick={() => { setOrdersPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                          Previous
                        </button>
                        <div className="flex items-center space-x-1">
                          {[...Array(totalOrderPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => { setOrdersPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                ordersPage === i + 1 
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          disabled={ordersPage === totalOrderPages}
                          onClick={() => { setOrdersPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-32 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-8">Your order history will appear here once you make a purchase.</p>
                  <Link to="/products" className="text-indigo-600 font-bold hover:text-indigo-700">
                    Browse our collection
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-indigo-600 font-bold text-sm uppercase tracking-widest hover:underline"
                    >
                      Edit Info
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Shipping Address</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your address"
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">State</label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">PIN Code</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="6-digit PIN"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`flex-[2] py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 ${
                          isSaving ? 'bg-gray-400 cursor-not-allowed' : 
                          saveSuccess ? 'bg-green-600 shadow-green-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 size={20} />
                            <span>Changes Saved!</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</h4>
                          <p className="text-lg font-bold text-gray-900">{fullName || user.displayName || 'Not provided'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</h4>
                          <p className="text-lg font-bold text-gray-900">{user.email}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</h4>
                          <p className="text-lg font-bold text-gray-900">{user.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping Address</h4>
                          <p className="text-lg font-bold text-gray-900 leading-relaxed">
                            {user.address ? (
                              <>
                                {user.address}<br />
                                {user.city}, {user.state} - {user.postalCode}
                              </>
                            ) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account Status</h4>
                          <div className="flex items-center space-x-2">
                            {auth.currentUser?.emailVerified ? (
                              <span className="text-green-600 font-bold flex items-center">
                                <CheckCircle2 size={16} className="mr-1" /> Verified
                              </span>
                            ) : (
                              <span className="text-yellow-600 font-bold flex items-center">
                                <AlertCircle size={16} className="mr-1" /> Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-50">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2"
                      >
                        <User size={20} />
                        <span>Edit Profile Details</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
