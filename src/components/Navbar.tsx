import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Shield, Search, Package, ChevronDown, Settings, Mail, Phone, Box, Heart, Check, ArrowRight } from 'lucide-react';
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

    if (!auth.currentUser) {
      setTrackError('Please login to track your order.');
      return;
    }

    setIsTrackLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const ordersRef = collection(db, 'orders');
      // We filter by orderId, email/phone AND userId to satisfy security rules
      const q = query(
        ordersRef, 
        where('orderId', '==', trackOrderId.trim().toUpperCase()),
        where(trackMethod === 'email' ? 'shippingDetails.email' : 'shippingDetails.phone', '==', trackValue.trim()),
        where('userId', '==', auth.currentUser.uid),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setTrackResult(querySnapshot.docs[0].data());
      } else {
        setTrackError('Order not found. Make sure the Order ID and ' + trackMethod + ' are correct and belong to your account.');
      }
    } catch (error: any) {
      console.error('Tracking error:', error);
      if (error.message?.includes('permission')) {
        setTrackError('You do not have permission to track this order. Please ensure you are logged in with the correct account.');
      } else {
        setTrackError('An error occurred while tracking your order. Please try again later.');
      }
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
    { name: 'Formal', path: '/products?category=Formal' },
    { name: 'Casual', path: '/products?category=Casual' },
    { name: 'Party', path: '/products?category=Party' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const moreLinks = [
    { name: 'FAQs', path: '/faqs' },
    { name: 'Terms', path: '/terms' },
    { name: 'Privacy', path: '/privacy' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <nav id="navbar" className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tighter italic">PRATHISS</span>
          </Link>

          {/* Search Bar (Desktop) */}
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
          <div className="flex items-center space-x-2 sm:space-x-6">
            <button 
              onClick={() => setIsTrackModalOpen(true)}
              className="hidden lg:flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Track Order
            </button>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              {user && (
                <Link to="/favorites" className="p-2 text-gray-600 hover:text-red-500 transition-colors relative">
                  <Heart size={20} className="sm:w-[22px] sm:h-[22px]" />
                  {user.favorites && user.favorites.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {user.favorites.length}
                    </span>
                  )}
                </Link>
              )}
              
              {user ? (
                <div className="flex items-center space-x-1 sm:space-x-4">
                  <Link to="/profile" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                    <User size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
                      <Shield size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                  <User size={20} className="sm:w-[22px] sm:h-[22px]" />
                </Link>
              )}
              
              <Link to="/cart" className="p-2 text-gray-600 hover:text-indigo-600 active:scale-95 transition-colors relative">
                <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links (Sub-header) - Desktop */}
      <div className="hidden md:block border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 h-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsMoreOpen(true)}
                onMouseLeave={() => setIsMoreOpen(false)}
                className="flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
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
                        className="block px-6 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 hover:text-indigo-600 transition-all"
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
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] md:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <div className="absolute top-0 right-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <span className="text-xl font-black text-indigo-950 italic">PRATHISS</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Search in Mobile Menu */}
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </form>

                {/* Main Links */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
                  <div className="grid grid-cols-1 gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        {link.name}
                        <ArrowRight size={16} className="text-gray-300" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* More Links */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Support</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsTrackModalOpen(true);
                      }} 
                      className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      Track Order
                      <Box size={16} className="text-gray-300" />
                    </button>
                    {moreLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        {link.name}
                        <ArrowRight size={16} className="text-gray-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Menu Footer */}
              <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      {user.fullName?.[0] || user.displayName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName || user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
                  >
                    <User size={18} />
                    <span>Login / Sign Up</span>
                  </Link>
                )}
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
