import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginApi, sendLoginOtpApi, loginWithOtpApi } from '../services/api';

function Login() {
  // Mode selection: 'otp' | 'password'
  const [authMode, setAuthMode] = useState('otp');

  // Common state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password-mode state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP-mode state
  const [otpStep, setOtpStep] = useState(1); // 1: Enter Email, 2: Enter OTP
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 60-second OTP resend countdown
  useEffect(() => {
    let interval = null;
    if (authMode === 'otp' && otpStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && otpStep === 2) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, timer]);

  // Reset states when switching tabs
  const handleSwitchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setOtpStep(1);
    setOtp('');
  };

  // ==========================================
  // 1. EMAIL OTP LOGIN
  // ==========================================

  // Step 1: Request Email Login OTP
  const handleRequestLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await sendLoginOtpApi(cleanEmail);
      if (response.data.success) {
        setSuccess(response.data.message || `Verification code sent to ${cleanEmail}`);
        setOtpStep(2);
        setTimer(60);
        setCanResend(false);
        setOtp('');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to dispatch login code. Please check your email.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify Email OTP & Authenticate
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginWithOtpApi({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (response.data.success) {
        setSuccess('🎉 Verified! Welcome back. Entering portal...');
        login(response.data.user, response.data.token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Verification failed. Please check the code or request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. PASSWORD LOGIN
  // ==========================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await loginApi({ email: cleanEmail, password });

      if (response.data.success) {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1c1917] flex items-center justify-center px-4 py-12 overflow-hidden selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Ambient warm background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-stone-800/70 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-8 sm:p-10">
        
        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-stone-900 to-amber-950 rounded-2xl flex items-center justify-center shadow-lg border border-stone-700 text-amber-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7" />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-[11px] font-black uppercase tracking-wider rounded-full border border-amber-300 mb-2">
            Jankapur Academic Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Student & Scholar Portal
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Access past papers, live quizzes & classmate network
          </p>
        </div>

        {/* Dual Mode Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-2xl mb-6 border border-stone-200">
          <button
            type="button"
            onClick={() => handleSwitchMode('otp')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'otp'
                ? 'bg-white text-stone-950 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email OTP Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('password')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'password'
                ? 'bg-white text-stone-950 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Password Sign In</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm font-medium mb-5 border border-red-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium mb-5 border border-emerald-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: EMAIL OTP LOGIN                                                   */}
        {/* ========================================================================= */}
        {authMode === 'otp' && (
          <>
            {otpStep === 1 ? (
              /* Step 1: Email Input */
              <form onSubmit={handleRequestLoginOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. scholar@gmail.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    We will send a 6-digit one-time verification code to this inbox.
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
                      <span>Sending Email Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Login Code</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification */
              <form onSubmit={handleVerifyLoginOtp} className="space-y-5">
                {/* Email badge with Edit button */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Recipient Email</div>
                      <div className="text-sm font-extrabold text-stone-800 truncate">{email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setError(''); setSuccess(''); }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition flex-shrink-0 ml-2"
                  >
                    Edit
                  </button>
                </div>

                {/* 6-Digit OTP Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl sm:text-3xl font-black tracking-[0.5em] py-3.5 px-4 rounded-2xl border-2 border-stone-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-stone-900 placeholder-stone-300 outline-none transition font-mono bg-stone-50/50 focus:bg-white"
                  />
                  <p className="text-[11px] text-center text-stone-400 mt-2">
                    Check your email inbox (and spam folder). Valid for 5 minutes.
                  </p>
                </div>

                {/* Resend Timer */}
                <div className="text-center pt-1">
                  {timer > 0 ? (
                    <div className="text-xs font-medium text-stone-500 flex items-center justify-center space-x-1.5">
                      <svg className="w-3.5 h-3.5 text-stone-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Resend code in <strong className="text-stone-700 font-bold font-mono">{timer}s</strong></span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRequestLoginOtp(e)}
                      disabled={sendingOtp}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition"
                    >
                      {sendingOtp ? 'Resending Code...' : 'Didn’t receive the code? Resend Email'}
                    </button>
                  )}
                </div>

                {/* Submit Verification */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                      <span>Verifying & Signing In...</span>
                    </>
                  ) : (
                    <span>Verify & Sign In</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: PASSWORD LOGIN                                                    */}
        {/* ========================================================================= */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. scholar@gmail.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline"
                >
                  Forgot Password?
                </Link>
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
                  placeholder="Enter password"
                  className="w-full pl-11 pr-10 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>
        )}

        {/* Global Bottom Navigation */}
        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-500">
            New student or scholar?{' '}
            <Link to="/register" className="text-amber-700 font-bold hover:text-amber-900 hover:underline">
              Create Student Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

