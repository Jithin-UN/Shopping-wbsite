import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send verification email via Firebase Auth
      await sendEmailVerification(user, {
        url: window.location.origin + '/auth-action',
      });

      // Create user profile in Firestore
      const isAdminEmail = email.toLowerCase() === 'jithinullodi@gmail.com';
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: isAdminEmail ? 'admin' : 'user',
          verified: false, // Mark as unverified in DB
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, `users/${user.uid}`);
      }

      // Show success message instead of navigating
      setError('A verification email has been sent to your inbox. Please verify your email before logging in.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup-page" className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500">Join Prathiss for exclusive offers</p>
        </div>

        {error && (
          <div className={`mb-6 p-4 border rounded-xl flex items-center text-sm ${
            error.includes('verification email has been sent') 
              ? 'bg-green-50 border-green-100 text-green-600' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {error.includes('verification email has been sent') ? (
              <CheckCircle2 size={18} className="mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            )}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] shadow-xl ${
              loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 inline-flex items-center">
              Sign in <ArrowRight size={16} className="ml-1" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
