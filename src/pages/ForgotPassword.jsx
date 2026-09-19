import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendResetPasswordOtpApi, resetPasswordApi } from '../services/api';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 60-second OTP resend countdown
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && step === 2) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Request Password Reset OTP to Email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await sendResetPasswordOtpApi(cleanEmail);
      if (response.data.success) {
        setSuccess(response.data.message || `Password recovery verification code sent to ${cleanEmail}`);
        setStep(2);
        setTimer(60);
        setCanResend(false);
        setOtp('');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to send recovery OTP. Please check the email address.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP & Apply New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordApi({
        email: cleanEmail,
        otp: cleanOtp,
        newPassword
      });

      if (response.data.success) {
        setSuccess('🎉 Password reset successfully! Redirecting to login in a moment...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Password reset failed. Invalid or expired OTP code.'
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
        <div className="text-center mb-6">
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
            {step === 1
              ? 'Verify your registered email address via OTP to set a new password'
              : `Enter the code sent to ${email} & choose a new password`}
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-amber-500' : 'w-6 bg-emerald-500'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-amber-500' : 'w-6 bg-stone-200'}`}></div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm font-medium mb-5 border border-red-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium mb-5 border border-emerald-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: EMAIL ADDRESS INPUT                                               */}
        {/* ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="scholar@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5">
                We will send a confidential 6-digit OTP code to verify your identity.
              </p>
            </div>

            <button
              type="submit"
              disabled={sendingOtp || !email.trim()}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
            >
              {sendingOtp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                  <span>Sending Recovery Code...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery OTP</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: OTP VERIFICATION & PASSWORD RESET                                 */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email badge with Edit button */}
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Target Email</div>
                  <div className="text-sm font-extrabold text-stone-800 truncate">{email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                className="flex-shrink-0 ml-2 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition"
              >
                Change
              </button>
            </div>

            {/* 6-Digit OTP Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                6-Digit Email Recovery Code
              </label>
              <input
                type="text"
                maxLength="6"
                autoFocus
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl sm:text-2xl font-black tracking-[0.4em] py-2.5 px-4 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-900 placeholder-stone-300 outline-none transition font-mono bg-stone-50/50 focus:bg-white"
              />
            </div>

            {/* Resend Timer */}
            <div className="text-center">
              {timer > 0 ? (
                <div className="text-xs font-medium text-stone-500 flex items-center justify-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-stone-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resend OTP in <strong className="text-stone-700 font-bold font-mono">{timer}s</strong></span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleRequestOtp(e)}
                  disabled={sendingOtp}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition"
                >
                  {sendingOtp ? 'Resending Code...' : 'Didn’t receive the code? Resend OTP'}
                </button>
              )}
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
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || newPassword.length < 6}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                  <span>Verifying & Resetting...</span>
                </>
              ) : (
                <span>Verify OTP & Set New Password</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Footer */}
        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
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
