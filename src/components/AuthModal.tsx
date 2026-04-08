import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {message}
            </p>

            <div className="space-y-4">
              <Link
                to="/login"
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <LogIn size={20} />
                <span>Login Now</span>
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all"
              >
                <UserPlus size={20} />
                <span>Create Account</span>
              </Link>
            </div>

            <button
              onClick={onClose}
              className="mt-6 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
