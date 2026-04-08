import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  cart: CartItem[];
  products: Product[];
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
}

export default function Cart({ cart, products, updateQuantity, removeFromCart }: CartProps) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  const getProductStock = (productId: string) => {
    return products.find(p => p.id === productId)?.stock || 0;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="w-24 h-24 bg-white text-gray-200 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your bag is empty</h2>
        <p className="text-gray-500 mb-10 max-w-md text-center leading-relaxed">
          Looks like you haven't added anything to your bag yet. Start exploring our collection to find your perfect dress.
        </p>
        <Link
          to="/products"
          className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-100"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div id="cart-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col sm:flex-row items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link to={`/product/${item.productId}`} className="w-32 h-40 flex-shrink-0 rounded-xl overflow-hidden mb-4 sm:mb-0 hover:opacity-90 transition-opacity">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="sm:ml-8 flex-grow text-center sm:text-left">
                  <Link to={`/product/${item.productId}`} className="hover:text-indigo-600 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  </Link>
                  <div className="flex items-center space-x-3 mb-4">
                    <p className="text-indigo-600 font-bold font-mono">₹{item.price.toLocaleString('en-IN')}</p>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                      Stock: {getProductStock(item.productId)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-4">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-8 text-right">
                  <p className="text-lg font-bold text-gray-900 font-mono">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Summary</h2>
            <div className="space-y-6 mb-8">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="font-bold text-gray-900 font-mono">
                  {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-indigo-600 font-mono">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] shadow-xl shadow-indigo-100"
            >
              <span>Checkout Now</span>
              <ArrowRight size={24} />
            </Link>
            <p className="text-xs text-gray-400 mt-6 text-center leading-relaxed">
              Taxes and shipping calculated at checkout. Secure payment powered by Prathiss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
