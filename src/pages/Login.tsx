import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, X, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'new-password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
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
              onClick={() => {
                setShowForgotModal(false);
                setResetStep('email');
                setResetError('');
                setResetSuccess('');
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <button 
                onClick={() => {
                  setShowForgotModal(false);
                  setResetStep('email');
                  setResetError('');
                  setResetSuccess('');
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {resetStep === 'email' ? <Mail size={32} /> : resetStep === 'otp' ? <KeyRound size={32} /> : <Lock size={32} />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {resetStep === 'email' ? 'Reset Password' : resetStep === 'otp' ? 'Verify OTP' : 'New Password'}
                </h3>
                <p className="text-gray-500 mt-2">
                  {resetStep === 'email' ? 'Enter your email to receive a 6-digit OTP' : 
                   resetStep === 'otp' ? `Enter the 6-digit code sent to ${resetEmail}` : 
                   'Create a strong new password for your account'}
                </p>
              </div>

              {resetError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-xs">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess ? (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-green-800 font-medium mb-4">{resetSuccess}</p>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetStep('email');
                      setResetSuccess('');
                    }}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {resetStep === 'email' && (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setResetLoading(true);
                        setResetError('');
                        try {
                          const response = await fetch('/api/auth/send-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail })
                          });
                          const data = await response.json();
                          if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
                          setResetStep('otp');
                        } catch (err: any) {
                          setResetError(err.message);
                        } finally {
                          setResetLoading(false);
                        }
                      }} 
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
                      >
                        {resetLoading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                      </button>
                    </form>
                  )}

                  {resetStep === 'otp' && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (otp.length !== 6) {
                          setResetError('Please enter a valid 6-digit OTP.');
                          return;
                        }
                        setResetStep('new-password');
                        setResetError('');
                      }} 
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Verification Code</label>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold tracking-[0.5em]"
                            placeholder="000000"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                      >
                        Verify OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetStep('email')}
                        className="w-full text-sm text-gray-500 font-medium hover:text-indigo-600"
                      >
                        Change Email
                      </button>
                    </form>
                  )}

                  {resetStep === 'new-password' && (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (newPassword !== confirmPassword) {
                          setResetError('Passwords do not match.');
                          return;
                        }
                        if (newPassword.length < 6) {
                          setResetError('Password must be at least 6 characters.');
                          return;
                        }
                        setResetLoading(true);
                        setResetError('');
                        try {
                          const response = await fetch('/api/auth/reset-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail, otp, newPassword })
                          });
                          const data = await response.json();
                          if (!response.ok) throw new Error(data.error || 'Failed to reset password');
                          setResetSuccess('Your password has been reset successfully! You can now sign in with your new password.');
                        } catch (err: any) {
                          setResetError(err.message);
                        } finally {
                          setResetLoading(false);
                        }
                      }} 
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
                      >
                        {resetLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
