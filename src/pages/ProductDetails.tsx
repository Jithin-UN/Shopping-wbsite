import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, Truck, ShieldCheck, RefreshCcw, Heart, Share2 } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductDetailsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
}

export default function ProductDetails({ products, onAddToCart, favorites, onToggleFavorite }: ProductDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);
  const isFavorite = id ? favorites.includes(id) : false;

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6">
          <Star size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
        <p className="text-gray-500 mb-8">The dress you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <div id="product-details-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-indigo-600 font-medium mb-12 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <span className="text-sm text-gray-500 font-medium">(4.8 / 5.0 based on 124 reviews)</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => product && onToggleFavorite(product.id)}
                className={`p-3 border rounded-xl transition-all shadow-sm ${isFavorite ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-100'}`}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="text-3xl font-bold text-indigo-600 font-mono mb-8">
            ₹{product.price.toLocaleString('en-IN')}
          </div>

          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            {product.description || "Experience the perfect blend of style and comfort with this exquisite dress. Handcrafted with premium materials, it's designed to make you stand out at any event."}
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Free Express Shipping</h4>
                <p className="text-xs text-gray-500">Estimated delivery: 3-5 business days</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Secure Checkout</h4>
                <p className="text-xs text-gray-500">Encrypted transactions for your peace of mind</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => onAddToCart(product)}
              className="flex-grow bg-indigo-600 text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] shadow-xl shadow-indigo-100"
            >
              <ShoppingCart size={24} />
              <span>Add to Shopping Bag</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
