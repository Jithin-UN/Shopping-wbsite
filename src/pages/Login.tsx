import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email address before signing in. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-500">Sign in to your Prathiss account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col text-red-600 text-sm">
            <div className="flex items-center mb-2">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes('verify your email') && (
              <button
                type="button"
                onClick={async () => {
                  if (auth.currentUser) {
                    try {
                      await sendEmailVerification(auth.currentUser, {
                        url: window.location.origin + '/auth-action',
                      });
                      alert('Verification email resent! Please check your inbox.');
                    } catch (err) {
                      alert('Failed to resend verification email.');
                    }
                  }
                }}
                className="text-indigo-600 font-bold hover:underline text-left ml-7"
              >
                Resend verification email
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Forgot Password?
            </button>
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
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 inline-flex items-center">
              Sign up free <ArrowRight size={16} className="ml-1" />
            </Link>
          </p>
          
          <div className="pt-6 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Admin Access</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Authorized administrators can access the panel by logging in with their registered credentials.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
                <p className="text-gray-500 mt-2">Enter your email to receive a reset link</p>
              </div>

              {resetSuccess ? (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-green-800 font-medium mb-4">{resetSuccess}</p>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResetLoading(true);
                    setError('');
                    try {
                      await sendPasswordResetEmail(auth, resetEmail, {
                        url: window.location.origin + '/auth-action',
                      });
                      setResetSuccess('Password reset email sent! Please check your inbox.');
                    } catch (err: any) {
                      console.error('Reset error:', err);
                      setError(err.message || 'Failed to send reset email.');
                    } finally {
                      setResetLoading(false);
                    }
                  }} 
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {resetLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
