import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Shield, Search, Package, ChevronDown, Settings, Mail, Phone, Box, Heart, Check } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
}

export default function Navbar({ user, cartCount }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackMethod, setTrackMethod] = useState<'email' | 'phone'>('email');
  const [trackValue, setTrackValue] = useState('');
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleString();
    if (date.toDate) return date.toDate().toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  const navigate = useNavigate();

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim() || !trackValue.trim()) {
      setTrackError('Please enter both Order ID and ' + (trackMethod === 'email' ? 'Email' : 'Phone'));
      return;
    }

    setIsTrackLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('orderId', '==', trackOrderId.trim().toUpperCase()),
        where(trackMethod === 'email' ? 'shippingDetails.email' : 'shippingDetails.phone', '==', trackValue.trim()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setTrackResult(querySnapshot.docs[0].data());
      } else {
        setTrackError('Order ID not found. Please check your details.');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setTrackError('An error occurred while tracking your order.');
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'All Products', path: '/products' },
    { name: 'Casual', path: '/products?category=Casual' },
    { name: 'Party', path: '/products?category=Party' },
    { name: 'Formal', path: '/products?category=Formal' },
  ];

  const moreLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQs', path: '/faqs' },
    { name: 'Terms', path: '/terms' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <nav id="navbar" className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-3xl font-black text-indigo-950 tracking-tighter italic">PRATHISS</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search for dresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsTrackModalOpen(true)}
              className="hidden sm:flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Track Order
            </button>
            
            <div className="flex items-center space-x-4">
              {user && (
                <Link to="/favorites" className="p-2 text-gray-600 hover:text-red-500 transition-colors relative">
                  <Heart size={22} />
                  {user.favorites && user.favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {user.favorites.length}
                    </span>
                  )}
                </Link>
              )}
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                    <User size={22} />
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
                      <Shield size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                  <User size={22} />
                </Link>
              )}
              
              <Link to="/cart" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors relative">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links (Sub-header) */}
      <div className="hidden md:block border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-10 h-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsMoreOpen(true)}
                onMouseLeave={() => setIsMoreOpen(false)}
                className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                More
                <ChevronDown size={14} className="ml-1" />
              </button>
              
              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseEnter={() => setIsMoreOpen(true)}
                    onMouseLeave={() => setIsMoreOpen(false)}
                    className="absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50"
                  >
                    {moreLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="block px-6 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 hover:text-indigo-600 transition-all"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-6">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for dresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </form>
              
              <div className="grid grid-cols-1 gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-bold text-gray-600 uppercase tracking-widest py-2 border-b border-gray-50"
                  >
                    {link.name}
                  </Link>
                ))}
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsTrackModalOpen(true);
                  }} 
                  className="text-sm font-bold text-indigo-600 uppercase tracking-widest py-2"
                >
                  Track Order
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track Order Modal */}
      <AnimatePresence>
        {isTrackModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <Box size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Track Order</h3>
                    <p className="text-xs text-gray-500">Enter your order details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTrackModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={handleTrackOrder} className="space-y-6">
                  {!trackResult ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Order ID</label>
                        <input
                          type="text"
                          value={trackOrderId}
                          onChange={(e) => setTrackOrderId(e.target.value)}
                          placeholder="Enter your Order ID"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                        <p className="mt-2 text-[10px] text-gray-400">Found in your order confirmation email</p>
                      </div>

                      <div className="flex p-1 bg-gray-50 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setTrackMethod('email')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            trackMethod === 'email' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Mail size={16} />
                          <span>Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackMethod('phone')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            trackMethod === 'phone' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Phone size={16} />
                          <span>Phone</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          {trackMethod === 'email' ? 'Email Address' : 'Phone Number'}
                        </label>
                        <div className="relative">
                          <input
                            type={trackMethod === 'email' ? 'email' : 'tel'}
                            value={trackValue}
                            onChange={(e) => setTrackValue(e.target.value)}
                            placeholder={`Enter your ${trackMethod}`}
                            className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                          />
                          {trackMethod === 'email' ? (
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          ) : (
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          )}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">
                          The {trackMethod} used when placing the order
                        </p>
                      </div>

                      {trackError && (
                        <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg">{trackError}</p>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsTrackModalOpen(false)}
                          className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isTrackLoading}
                          className="flex-1 py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100 flex items-center justify-center"
                        >
                          {isTrackLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            'Track Order'
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-bold text-indigo-600">{trackResult.status.toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                            <p className="text-sm font-mono font-bold text-gray-900">{trackResult.orderId}</p>
                          </div>
                        </div>
                        
                        {/* Amazon-style Progress Bar */}
                        <div className="relative mb-8">
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                          <div 
                            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                            style={{ 
                              width: trackResult.status === 'pending' ? '12.5%' : 
                                     trackResult.status === 'processing' ? '37.5%' : 
                                     trackResult.status === 'shipped' ? '62.5%' : 
                                     trackResult.status === 'delivered' || trackResult.status === 'completed' ? '100%' : '0%' 
                            }}
                          ></div>
                          
                          <div className="relative flex justify-between">
                            {[
                              { label: 'Ordered', status: 'pending' },
                              { label: 'Processing', status: 'processing' },
                              { label: 'Shipped', status: 'shipped' },
                              { label: 'Delivered', status: 'delivered' }
                            ].map((step, index) => {
                              const isCompleted = 
                                (trackResult.status === 'pending' && index === 0) ||
                                (trackResult.status === 'processing' && index <= 1) ||
                                (trackResult.status === 'shipped' && index <= 2) ||
                                ((trackResult.status === 'delivered' || trackResult.status === 'completed') && index <= 3);
                              
                              return (
                                <div key={step.label} className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center z-10 transition-colors ${
                                    isCompleted ? 'bg-green-500 border-green-100' : 'bg-white border-gray-100'
                                  }`}>
                                    {isCompleted && <Check size={12} className="text-white" />}
                                  </div>
                                  <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                                    isCompleted ? 'text-green-600' : 'text-gray-300'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                          <p className="text-xs font-bold text-gray-900">{trackResult.shippingDetails.fullName}</p>
                          <p className="text-[10px] text-gray-500">{trackResult.shippingDetails.phone}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                          <p className="text-xs font-bold text-indigo-600">₹{trackResult.totalAmount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-500">{trackResult.items.length} Items</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ordered Items</p>
                        <div className="space-y-2">
                          {trackResult.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-50 shadow-sm">
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded-md" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-gray-900 truncate">{item.name}</p>
                                <p className="text-[8px] text-gray-500">Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shipping Address</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {trackResult.shippingDetails.address}, {trackResult.shippingDetails.city}, {trackResult.shippingDetails.state} - {trackResult.shippingDetails.postalCode}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Date</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(trackResult.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-3 pt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setTrackResult(null);
                            setTrackOrderId('');
                          }}
                          className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                        >
                          Check Another Order ID
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsTrackModalOpen(false)}
                          className="w-full py-4 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
