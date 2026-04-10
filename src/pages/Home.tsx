import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface HomeProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
}

export default function Home({ products, onAddToCart, favorites, onToggleFavorite }: HomeProps) {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubscribeStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubscribing(true);
    setSubscribeStatus('idle');

    try {
      // 1. Check if already subscribed
      const docRef = doc(db, 'subscribers', email.toLowerCase());
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `subscribers/${email.toLowerCase()}`);
        throw error;
      }
      
      if (docSnap.exists()) {
        setSubscribeStatus('error');
        setErrorMessage('This email is already subscribed!');
        setIsSubscribing(false);
        return;
      }

      // 2. Save subscription directly (no verification required for newsletter)
      try {
        await setDoc(docRef, {
          email: email.toLowerCase(),
          subscribedAt: serverTimestamp(),
          verified: true
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subscribers/${email.toLowerCase()}`);
        throw error;
      }

      // 3. Call Backend to send confirmation email
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to send confirmation email');
      }

      setSubscribeStatus('success');
      setEmail('');
    } catch (error: any) {
      console.error('Subscription error:', error);
      setSubscribeStatus('error');
      // Only set error message if it's not already set by the logic above
      if (!errorMessage) {
        setErrorMessage(error.message || 'Something went wrong. Please try again later.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const featuredProducts = [...products]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div id="home-page" className="space-y-24 pb-24 bg-white">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-gray-50">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-3xl mx-auto"
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-6 block">New Collection 2026</span>
            <h1 className="text-6xl md:text-8xl font-black text-indigo-950 tracking-tighter mb-8 leading-none italic">
              Timeless <br /> Elegance.
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-xl mx-auto font-medium">
              Curated luxury dresses for the modern woman who values style and substance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-10 py-5 bg-indigo-950 text-white font-bold rounded-full hover:bg-indigo-900 transition-all transform hover:scale-105 shadow-2xl"
              >
                Explore Collection
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Casual Outfits", img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800", link: "/products?category=Casual" },
            { title: "Party Wear", img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800", link: "/products?category=Party" },
            { title: "Formal Dresses", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", link: "/products?category=Formal" }
          ].map((cat, idx) => (
            <Link key={idx} to={cat.link} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100">
              <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-2xl font-bold text-white mb-2">{cat.title}</h3>
                <span className="text-sm font-medium text-white/80 flex items-center group-hover:translate-x-2 transition-transform">
                  Shop Now <ArrowRight size={16} className="ml-2" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Trending Now</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart} 
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-gray-400 font-medium">No products found. Add some in the admin panel!</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Join the Prathiss Club</h2>
            <p className="text-indigo-100 mb-10 text-lg">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubscribing || subscribeStatus === 'success'}
                  className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                />
                <AnimatePresence>
                  {subscribeStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400"
                    >
                      <CheckCircle2 size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="submit"
                disabled={isSubscribing || subscribeStatus === 'success'}
                className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center min-w-[140px]"
              >
                {isSubscribing ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : subscribeStatus === 'success' ? (
                  'Subscribed!'
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
            <AnimatePresence>
              {subscribeStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center justify-center text-red-200 text-sm font-medium"
                >
                  <AlertCircle size={16} className="mr-2" />
                  {errorMessage}
                </motion.div>
              )}
              {subscribeStatus === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-indigo-100 text-sm font-medium"
                >
                  Welcome to the club! You've successfully subscribed.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
