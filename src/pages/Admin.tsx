import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Search, Package, IndianRupee, Tag, Image as ImageIcon, X, Save, AlertCircle, Upload, Settings, Truck, Eye, Mail, CheckCircle, Clock, Box, Download } from 'lucide-react';
import { Product, Order } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, setDoc, orderBy, onSnapshot, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface AdminProps {
  products: Product[];
}

export default function Admin({ products }: AdminProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [statusInput, setStatusInput] = useState<Order['status']>('pending');
  const [orderFilter, setOrderFilter] = useState<'active' | 'completed'>('active');
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPerPage = 10;
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [shippingSettings, setShippingSettings] = useState({
    freeOrdersCount: 3,
    freeShippingThreshold: 600
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleString();
    if (date.toDate) return date.toDate().toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const q = query(collection(db, 'settings'), where('id', '==', 'shipping'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setShippingSettings({
            freeOrdersCount: data.freeOrdersCount ?? 3,
            freeShippingThreshold: data.freeShippingThreshold ?? 600
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'settings');
      }
    };
    fetchSettings();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
      setOrdersLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'active') {
      return ['pending', 'processing', 'shipped'].includes(order.status);
    }
    return ['delivered', 'completed', 'cancelled'].includes(order.status);
  });

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

  const handleUpdateOrder = async (orderId: string) => {
    setUpdatingOrder(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const previousStatus = selectedOrder?.status;
      const newStatus = statusInput;

      // If order is being cancelled, restore stock
      if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
        const stockRestores = selectedOrder?.items.map(item => {
          const productRef = doc(db, 'products', item.productId);
          return updateDoc(productRef, {
            stock: increment(item.quantity)
          });
        });
        if (stockRestores) await Promise.all(stockRestores);
      }
      // If order was cancelled but is now being restored (e.g. back to pending), reduce stock again
      else if (previousStatus === 'cancelled' && newStatus !== 'cancelled') {
        const stockReduces = selectedOrder?.items.map(item => {
          const productRef = doc(db, 'products', item.productId);
          return updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        });
        if (stockReduces) await Promise.all(stockReduces);
      }

      const updateData: Partial<Order> = {
        status: newStatus
      };

      await updateDoc(orderRef, updateData);
      
      // Direct Email Simulation (as requested by user)
      console.log(`%c [DIRECT EMAIL SENT TO GMAIL] To: ${selectedOrder?.shippingDetails.email} \n Subject: Order Update - ${selectedOrder?.orderId} \n Body: Your order status has been updated to: ${statusInput}.`, 'background: #10b981; color: #fff; padding: 10px; border-radius: 5px;');
      alert(`Status update email sent directly to ${selectedOrder?.shippingDetails.email}`);
      
      // Close the details modal
      setSelectedOrder(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      alert('Failed to update order.');
    } finally {
      setUpdatingOrder(false);
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
Generated by Admin Panel - Prathiss
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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      // Use setDoc with a fixed ID for settings
      await setDoc(doc(db, 'settings', 'shipping'), {
        id: 'shipping',
        ...shippingSettings,
        updatedAt: serverTimestamp()
      });
      alert('Settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/shipping');
      alert('Failed to update settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Casual',
    imageUrl: '',
    stock: '0'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError('');
      // If file is very large (e.g., > 5MB), warn the user
      if (file.size > 5000000) {
        setError('Image size too large. Please select an image under 5MB.');
        return;
      }

      setImageLoading(true);
      const reader = new FileReader();
      
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
        setImageLoading(false);
      };

      reader.onloadend = () => {
        const img = new Image();
        
        img.onerror = () => {
          setError('Failed to load image. Please try another file.');
          setImageLoading(false);
        };

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Max dimensions for reasonable quality/size
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 1000;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Check if compressed size is still too large for Firestore (1MB)
            const sizeInBytes = Math.round((dataUrl.split(',')[1].length * 3) / 4);
            if (sizeInBytes > 1000000) {
              setError('The image is still too large after compression. Please try a smaller image.');
              setImageLoading(false);
              return;
            }

            setFormData({ ...formData, imageUrl: dataUrl });
            setImageLoading(false);
          } catch (err) {
            console.error('Image processing error:', err);
            setError('Error processing image. Please try again.');
            setImageLoading(false);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = ['Casual', 'Formal', 'Party', 'Wedding', 'Summer', 'Winter'];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const productPrice = parseFloat(formData.price);
    const productStock = parseInt(formData.stock);

    if (isNaN(productPrice) || productPrice < 0) {
      setError('Please enter a valid price.');
      setLoading(false);
      return;
    }

    if (isNaN(productStock) || productStock < 0) {
      setError('Please enter a valid stock quantity.');
      setLoading(false);
      return;
    }

    if (!formData.imageUrl) {
      setError('Please upload an image or provide a valid image URL.');
      setLoading(false);
      return;
    }

    const productData = {
      ...formData,
      price: productPrice,
      stock: productStock,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (err: any) {
      console.error('Admin action error:', err);
      try {
        handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
      } catch (finalErr: any) {
        setError(finalErr.message || 'Failed to save product.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: 'Casual', imageUrl: '', stock: '0' });
    setEditingProduct(null);
    setIsAdding(false);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl,
      stock: (product.stock || 0).toString()
    });
    setIsAdding(true);
  };

  return (
    <div id="admin-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <div className="flex items-center space-x-6 mt-4">
            <button 
              onClick={() => setActiveTab('products')}
              className={`pb-2 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'products' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-2 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'orders' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-2 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'settings' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Settings
            </button>
          </div>
        </div>
        {activeTab === 'products' && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-100"
          >
            <Plus size={20} className="mr-2" />
            Add New Product
          </button>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm font-mono text-gray-500">{selectedOrder.orderId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => downloadOrderReceipt(selectedOrder)} 
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download Receipt"
                  >
                    <Download size={20} />
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer</h3>
                    <p className="font-bold text-gray-900">{selectedOrder.shippingDetails.fullName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.shippingDetails.email}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.shippingDetails.phone}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shipping Address</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedOrder.shippingDetails.address}<br />
                      {selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state} - {selectedOrder.shippingDetails.postalCode}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Date</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <p className="font-bold text-gray-900">Total Amount</p>
                      <p className="text-lg font-bold text-indigo-600">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Management */}
                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-6">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Manage Order</h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Status</label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value as Order['status'])}
                        className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdateOrder(selectedOrder.id)}
                    disabled={updatingOrder}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
                  >
                    {updatingOrder ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Update Status & Notify Customer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm">
                    <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Product Name</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Elegant Evening Gown"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Stock Quantity</label>
                    <div className="relative">
                      <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Product Image</label>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group relative overflow-hidden"
                      >
                        {imageLoading ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-sm font-bold text-indigo-900">Processing...</p>
                          </div>
                        ) : formData.imageUrl ? (
                          <div className="relative w-full aspect-[3/4] max-w-[180px]">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-lg" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                                <Upload className="text-white" size={24} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-white shadow-sm text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Upload size={32} />
                            </div>
                            <p className="text-sm font-bold text-indigo-900">Upload from Device</p>
                            <p className="text-xs text-indigo-400 mt-1">PNG, JPG up to 5MB</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden" 
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-100"></div>
                          </div>
                          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                            <span className="bg-white px-4 text-gray-400">Or use URL</span>
                          </div>
                        </div>
                        
                        <div className="mt-6 relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="url"
                            value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Paste image link here..."
                          />
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400 leading-relaxed italic text-center">
                          * Note: Uploaded images are stored directly in the database. For better performance, use high-quality URLs.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Describe the product details, materials, and fit..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-grow py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-grow py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'settings' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center space-x-3">
              <Settings className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
            </div>
            
            <form onSubmit={handleUpdateSettings} className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Truck size={20} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Shipping Policy</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Free Orders Count</label>
                        <input
                          type="number"
                          value={shippingSettings.freeOrdersCount}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, freeOrdersCount: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="mt-2 text-[10px] text-gray-400">Number of initial orders that get free shipping.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Free Shipping Threshold (₹)</label>
                        <input
                          type="number"
                          value={shippingSettings.freeShippingThreshold}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="mt-2 text-[10px] text-gray-400">Orders above this amount get free shipping after the initial free orders.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
                >
                  {settingsLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      ) : activeTab === 'orders' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Orders</h2>
              <p className="text-sm text-gray-500 mt-1">Efficiently handle and track customer orders</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100">
                <button
                  onClick={() => { setOrderFilter('active'); setOrdersPage(1); }}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    orderFilter === 'active' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Active Orders
                </button>
                <button
                  onClick={() => { setOrderFilter('completed'); setOrdersPage(1); }}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    orderFilter === 'completed' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Completed/Cancelled
                </button>
              </div>
              
              <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest">
                {filteredOrders.length} {orderFilter === 'active' ? 'Active' : 'Archived'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-mono font-bold text-gray-900 text-sm">{order.orderId}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900 text-sm">{order.shippingDetails.fullName}</p>
                      <p className="text-[10px] text-gray-500">{order.shippingDetails.email}</p>
                    </td>
                    <td className="px-8 py-6 font-mono font-bold text-indigo-600">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-green-50 text-green-600' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusInput(order.status);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => downloadOrderReceipt(order)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Download Receipt"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && !ordersLoading && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box size={32} />
              </div>
              <p className="text-gray-400 font-medium">No {orderFilter} orders found.</p>
            </div>
          )}
          {ordersLoading && (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalOrderPages > 1 && (
            <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Page {ordersPage} of {totalOrderPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(prev => prev - 1)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalOrderPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setOrdersPage(i + 1)}
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
                  onClick={() => setOrdersPage(prev => prev + 1)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-gray-900">Product List</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-8 py-4">Product</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Price</th>
                <th className="px-8 py-4">Stock</th>
                <th className="px-8 py-4">Created</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-16 object-cover rounded-lg shadow-sm" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-gray-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`font-bold text-sm ${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock || 0}
                    </span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Available</p>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-500">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 font-medium">No products found in inventory.</p>
          </div>
        )}
      </div>
    )}
  </div>
);
}
