import React from 'react';
import { motion } from 'motion/react';
import { Heart, Shield, Truck, Clock } from 'lucide-react';

export default function About() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-indigo-950 mb-6 italic tracking-tighter">OUR STORY</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Founded with a passion for elegance and style, PRATHISS is your destination for premium fashion that speaks volumes. We believe that every dress tells a story, and we're here to help you write yours.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000" 
              alt="Fashion" 
              className="rounded-3xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900">Quality Meets Elegance</h2>
            <p className="text-gray-600 leading-relaxed">
              At PRATHISS, we meticulously curate our collection to ensure that every piece meets our high standards of quality and design. From casual daywear to stunning party outfits and professional formal attire, we have something for every occasion.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Heart className="text-red-500 mb-2" size={24} />
                <h4 className="font-bold text-gray-900">Made with Love</h4>
                <p className="text-xs text-gray-500">Every piece is selected with care.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Shield className="text-indigo-600 mb-2" size={24} />
                <h4 className="font-bold text-gray-900">Secure Shopping</h4>
                <p className="text-xs text-gray-500">Your data is always protected.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={32} />, title: 'Fast Delivery', desc: 'Quick shipping across India' },
            { icon: <Clock size={32} />, title: '24/7 Support', desc: 'We are here to help anytime' },
            { icon: <Shield size={32} />, title: 'Quality Check', desc: '100% genuine products' },
            { icon: <Heart size={32} />, title: 'Easy Returns', desc: 'Hassle-free return policy' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
