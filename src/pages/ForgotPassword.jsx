import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPasswordApi } from '../services/api';

function ForgotPassword() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [schoolName, setSchoolName] = useState('Jankapur High School');
  const [classOrBatch, setClassOrBatch] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit registered phone number.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordApi({
        phoneNumber,
        schoolName,
        classOrBatch,
        newPassword
      });

      if (response.data.success) {
        setSuccess('Password updated successfully! Redirecting to login in a moment...');
        setTimeout(() => {
          navigate('/login');
        }, 2200);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Password reset failed. Please ensure your registered school and class match your enrollment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1c1917] flex items-center justify-center px-4 py-12 overflow-hidden selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Ambient warm glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-stone-800/70 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-stone-900 to-amber-950 rounded-2xl flex items-center justify-center shadow-lg border border-stone-700 text-amber-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-[11px] font-black uppercase tracking-wider rounded-full border border-amber-300 mb-2">
            Jankapur Academic Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Account Recovery
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Verify your school details to set a new password
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm font-medium mb-6 border border-red-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium mb-6 border border-emerald-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registered Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Registered Mobile Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="text"
                maxLength="10"
                required
                placeholder="10-digit mobile number"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {/* School Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Registered School / Institution
            </label>
            <select
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
            >
              <option value="Jankapur High School">Jankapur High School</option>
              <option value="Jankapur Primary School">Jankapur Primary School</option>
              <option value="Bodhi Bikash">Bodhi Bikash</option>
              <option value="Jankapur High Madrasha">Jankapur High Madrasha</option>
            </select>
          </div>

          {/* Class / Batch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Registered Class / Batch
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10 or Batch 2024"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
              value={classOrBatch}
              onChange={(e) => setClassOrBatch(e.target.value)}
            />
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold focus:outline-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 6 characters"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                <span>Verifying & Resetting...</span>
              </>
            ) : (
              <span>Reset Password Instantly</span>
            )}
          </button>
        </form>

        {/* Back to Login Footer */}
        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-500">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-amber-700 font-bold hover:text-amber-900 hover:underline">
              Sign In to Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
