import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState(token ? 'loading' : 'idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center text-white px-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Wallet className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Expense Tracker</h1>
          <p className="text-lg text-white/80">Track Your Money, Build a Better Tomorrow</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Email Verification</h2>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
              <p className="text-gray-500">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-green-700 dark:text-green-400">{message}</p>
              <Link
                to="/login"
                className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-red-600">{message}</p>
              <Link to="/login" className="text-primary-600 hover:underline text-sm">
                Back to Login
              </Link>
            </div>
          )}

          {status === 'idle' && (
            <p className="text-gray-500">No verification token provided. Check your email link.</p>
          )}
        </div>
      </div>
    </div>
  );
}
