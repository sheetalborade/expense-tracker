import { useState } from 'react';
import Navbar from '../layouts/Navbar';
import { useAuth } from '../features/auth/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const res = await api.patch('/auth/me', { name, email });
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      setMsg('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    }
  };

  const handleResendVerification = async () => {
    setMsg('');
    setError('');
    try {
      const res = await api.post('/auth/resend-verification');
      const link = res.data.data?.verificationLink;
      setMsg(
        link
          ? `Verification link generated (dev): ${link}`
          : res.data.message || 'Verification email sent'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification');
    }
  };

  return (
    <div>
      <Navbar title="Profile" subtitle="Update your personal information" />
      <div className="p-6 max-w-xl space-y-6">
        {msg && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm break-all">{msg}</div>
        )}
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Email Status</h3>
            {user?.email_verified ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                Verified
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                Not verified
              </span>
            )}
          </div>
          {!user?.email_verified && (
            <button
              type="button"
              onClick={handleResendVerification}
              className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
            >
              Resend verification link
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Personal Info</h3>
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
