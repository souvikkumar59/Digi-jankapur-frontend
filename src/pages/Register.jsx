import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    gender: 'Male',
    schoolName: 'Jankapur High School',
    classOrBatch: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await registerApi(formData);

      if (response.data.success) {
        setSuccess('Enrollment successful! Redirecting to student login...');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-stone-900 to-amber-950 rounded-2xl flex items-center justify-center shadow-lg border border-stone-700 text-amber-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-[11px] font-black uppercase tracking-wider rounded-full border border-amber-300 mb-2">
            Jankapur Academic Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Scholar Enrollment
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Create your profile to access exams, papers & peer community
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm font-medium mb-5 border border-red-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium mb-5 border border-emerald-200 flex items-start space-x-2">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                maxLength="10"
                required
                placeholder="10-digit number"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition font-medium text-sm"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
              />
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
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent"></div>
                <span>Creating Scholar Account...</span>
              </>
            ) : (
              <span>Complete Enrollment</span>
            )}
          </button>
        </form>

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
