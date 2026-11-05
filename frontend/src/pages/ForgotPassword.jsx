import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Mail, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      // In development the API returns the reset link so you can test without email
      if (res.data.data?.resetLink) {
        setResetLink(res.data.data.resetLink);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
          <p className="text-gray-500 mb-8">
            Enter your email and we will generate a password reset link.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                If that email exists in our system, a reset link has been generated.
              </div>

              {resetLink && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-2">
                  <p className="font-medium text-amber-800">
                    Development mode — use this link to reset:
                  </p>
                  <a
                    href={resetLink}
                    className="block break-all text-primary-600 hover:underline"
                  >
                    {resetLink}
                  </a>
                  <p className="text-xs text-amber-600">
                    (In production this would be sent to your email)
                  </p>
                </div>
              )}

              <Link
                to="/login"
                className="inline-block text-sm text-primary-600 font-medium hover:underline"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
