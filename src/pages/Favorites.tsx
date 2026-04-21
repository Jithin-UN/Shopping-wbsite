import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';

interface FavoritesProps {
  products: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
}

export default function Favorites({ products, favorites, onToggleFavorite }: FavoritesProps) {
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div id="favorites-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 italic tracking-tight">Your Favorites</h1>
          <p className="text-gray-500 font-medium">Items you've saved for later.</p>
        </div>
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
          <Heart size={32} fill="currentColor" />
        </div>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {favoriteProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-32 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
            Save your favorite dresses to keep track of them and find them easily later.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-10 py-5 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl"
          >
            Explore Collection
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
