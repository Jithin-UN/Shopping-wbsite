import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isFavorite = false, onToggleFavorite }) => {
  return (
    <motion.div
      id={`product-card-${product.id}`}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-md uppercase tracking-widest shadow-sm">
            Free Shipping
          </span>
        </div>
        <div className="absolute top-3 right-3 space-y-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onToggleFavorite?.(product.id)}
            className={`p-2 rounded-full shadow-md transition-colors active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'}`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-white text-indigo-600 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-indigo-50 active:scale-95 transition-colors"
          >
            <ShoppingCart size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product.id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </Link>
          <span className="text-indigo-600 font-bold font-mono">₹{product.price.toLocaleString('en-IN')}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md uppercase tracking-wider">
            {product.category}
          </span>
          <Link
            to={`/product/${product.id}`}
            className="text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
