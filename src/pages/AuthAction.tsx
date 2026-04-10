import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode, checkActionCode } from 'firebase/auth';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'input'>('loading');
  const [message, setMessage] = useState('Processing request...');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setMessage('Invalid or missing action code.');
      return;
    }

    switch (mode) {
      case 'resetPassword':
        handleResetPassword();
        break;
      case 'verifyEmail':
        handleVerifyEmail();
        break;
      default:
        setStatus('error');
        setMessage('Unsupported action mode.');
    }
  }, [mode, oobCode]);

  const handleResetPassword = async () => {
    try {
      const userEmail = await verifyPasswordResetCode(auth, oobCode!);
      setEmail(userEmail);
      setStatus('input');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setStatus('error');
      setMessage(error.message || 'The reset link has expired or already been used.');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await applyActionCode(auth, oobCode!);
      setStatus('success');
      setMessage('Your email has been successfully verified! You can now sign in to your account.');
    } catch (error: any) {
      console.error('Verify email error:', error);
      setStatus('error');
      setMessage(error.message || 'The verification link has expired or already been used.');
    }
  };

  const onResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully! You can now sign in with your new password.');
    } catch (error: any) {
      console.error('Confirm reset error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center"
      >
        {status === 'loading' && (
          <div className="space-y-6 py-8">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="text-gray-600 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <span>Sign In Now</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Action Failed</h2>
            <p className="text-gray-600 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
              Back to Login
            </Link>
          </div>
        )}

        {status === 'input' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">New Password</h2>
              <p className="text-gray-500 mt-2">Resetting password for <span className="text-indigo-600 font-medium">{email}</span></p>
            </div>

            <form onSubmit={onResetSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Reset Password
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
