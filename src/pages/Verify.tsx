import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your subscription...');

  useEffect(() => {
    const verifyEmail = async () => {
      const email = searchParams.get('email');
      const token = searchParams.get('token');

      if (!email || !token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const docRef = doc(db, 'subscribers', email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setStatus('error');
          setMessage('Subscription not found.');
          return;
        }

        const data = docSnap.data();
        if (data.verified) {
          setStatus('success');
          setMessage('Your email is already verified!');
          return;
        }

        if (data.verificationToken !== token) {
          setStatus('error');
          setMessage('Invalid verification token.');
          return;
        }

        // Update to verified
        await updateDoc(docRef, {
          verified: true,
          verificationToken: null // Clear token after use
        });

        // Call backend to send confirmation email
        const response = await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase() })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to send confirmation email');
        }

        setStatus('success');
        setMessage('Your subscription has been successfully verified!');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong during verification.');
        handleFirestoreError(error, OperationType.UPDATE, `subscribers/${email}`);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Subscription Verified!</h2>
            <p className="text-gray-600">{message}</p>
            <Link 
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
            >
              Go to Home
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
            <Link 
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
              Back to Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
