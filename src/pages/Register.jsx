import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi, sendRegistrationOtpApi } from '../services/api';

function Register() {
  const [step, setStep] = useState(1); // 1: Scholar Details, 2: Email OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    gender: 'Male',
    schoolName: 'Jankapur High School',
    classOrBatch: ''
  });
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 60-second countdown timer for OTP resend
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate information and dispatch Email OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    // Pre-validation
    if (!formData.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!formData.classOrBatch.trim()) {
      setError('Please enter your class or batch (e.g. Class 10 / Batch 2024).');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await sendRegistrationOtpApi(cleanEmail);
      if (response.data.success) {
        setSuccess(response.data.message || `Verification code sent to ${cleanEmail}`);
        setStep(2);
        setTimer(60);
        setCanResend(false);
        setOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification email. Please check your address.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Submit final registration with Email OTP
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (response.data.success) {
        setSuccess('🎉 Email verified & scholar enrollment successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1c1917] flex items-center justify-center px-4 py-10 overflow-hidden selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-stone-800/70 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg p-8 sm:p-10">
        
        {/* Top Branding & Step Progress */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-stone-900 to-amber-950 rounded-2xl flex items-center justify-center shadow-lg border border-stone-700 text-amber-400">
            {step === 1 ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-[11px] font-black uppercase tracking-wider rounded-full border border-amber-300 mb-2">
            Jankapur Academic Network
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {step === 1 ? 'Scholar Enrollment' : 'Verify Email Address'}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {step === 1 
              ? 'Create your profile to access exams, papers & peer community' 
              : `Enter the 6-digit code sent to ${formData.email}`}
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-amber-500' : 'w-6 bg-emerald-500'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-amber-500' : 'w-6 bg-stone-200'}`}></div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm font-medium mb-5 border border-red-200 flex items-start space-x-2 animate-fadeIn">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium mb-5 border border-emerald-200 flex items-start space-x-2 animate-fadeIn">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: SCHOLAR DETAILS FORM                                             */}
        {/* ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Souvik Baguli"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address (For Verification & Logins)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. student@gmail.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">+91</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    maxLength="10"
                    placeholder="10-digit number"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Set Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min. 6 chars"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Class / Batch
                </label>
                <input
                  type="text"
                  name="classOrBatch"
                  required
                  placeholder="e.g. Class 10 / Batch 2024"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                  value={formData.classOrBatch}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                School / Institution
              </label>
              <select
                name="schoolName"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={formData.schoolName}
                onChange={handleChange}
              >
                <option value="Jankapur High School">Jankapur High School</option>
                <option value="Jankapur Primary School">Jankapur Primary School</option>
                <option value="Bodhi Bikash">Bodhi Bikash</option>
                <option value="Jankapur High Madrasha">Jankapur High Madrasha</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
            >
              {sendingOtp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                  <span>Dispatching Email Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email with OTP</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: EMAIL OTP VERIFICATION FORM                                      */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5">
            {/* Email badge & edit button */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Target Email</div>
                  <div className="text-sm font-extrabold text-stone-800 truncate">{formData.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition flex-shrink-0 ml-2"
              >
                Edit Email
              </button>
            </div>

            {/* 6-Digit OTP Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 text-center">
                6-Digit Verification Code
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

            {/* Resend Timer & Resend Action */}
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
                  onClick={(e) => handleRequestOtp(e)}
                  disabled={sendingOtp}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition"
                >
                  {sendingOtp ? 'Resending Code...' : 'Didn’t receive the code? Resend Email'}
                </button>
              )}
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                  <span>Verifying & Finalizing Account...</span>
                </>
              ) : (
                <span>Verify Email & Complete Enrollment</span>
              )}
            </button>

            {/* Back button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 transition"
              >
                ← Back to Edit Scholar Details
              </button>
            </div>
          </form>
        )}

        {/* Global Footer */}
        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-500">
            Already enrolled?{' '}
            <Link to="/login" className="text-amber-700 font-bold hover:text-amber-900 hover:underline">
              Sign In to Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

