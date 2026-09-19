import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Load Razorpay Checkout Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Directory() {
  const { token, user, login } = useContext(AuthContext);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search filters
  const [schoolFilter, setSchoolFilter] = useState('');
  const [searchName, setSearchName] = useState('');

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bio: user?.bio || '',
    classOrBatch: user?.classOrBatch || '',
    profilePicture: user?.profilePicture || '',
  });

  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    unlocked: false,
    viewers: [],
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Fetch classmates directory
  const fetchDirectory = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        'https://smart-jankapur-backend.onrender.com/api/users/directory',
        {
          params: {
            schoolName: schoolFilter || undefined,
            name: searchName || undefined,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStudents(response.data.data || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Directory fetch error:', err);
      setError('Failed to fetch the classmate network.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile viewer analytics
  const fetchViewerAnalytics = async () => {
    if (!token) return;

    setAnalyticsLoading(true);

    try {
      const response = await axios.get(
        'https://smart-jankapur-backend.onrender.com/api/users/profile/analytics',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAnalyticsData({
          unlocked: response.data.unlocked || false,
          viewers: response.data.viewers || [],
        });
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDirectory();
      fetchViewerAnalytics();
    }
  }, [schoolFilter, searchName, token]);

  // Handle profile update
  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Please login first.');
      return;
    }

    setEditLoading(true);
    setEditSuccess('');

    try {
      const response = await axios.put(
        'https://smart-jankapur-backend.onrender.com/api/users/profile',
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setEditSuccess(
          'Your profile card has been updated successfully! 🎉'
        );

        const updatedUserMetadata = {
          ...user,
          ...response.data.data,
        };

        login(updatedUserMetadata, token);

        setTimeout(() => {
          setIsEditingProfile(false);
          setEditSuccess('');
          fetchDirectory();
        }, 1500);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert(
        err.response?.data?.message || 'Profile update failed.'
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Track profile view
  const handleProfileClickView = async (targetId, classmateName) => {
    if (!token) {
      alert('Please login first.');
      return;
    }

    try {
      const response = await axios.post(
        `https://smart-jankapur-backend.onrender.com/api/users/view/${targetId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert(
          `🎯 Profile view logged! ${classmateName} now has ${
            response.data.views || 0
          } profile views.`
        );

        fetchDirectory();
      }
    } catch (err) {
      console.error('Profile view error:', err);
      alert(`Waved 👋 at ${classmateName}!`);
    }
  };

  // Razorpay checkout for unlocking analytics
  const processAnalyticsCheckout = async () => {
    if (!token) {
      alert('Please login first.');
      return;
    }

    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      alert('Failed to connect to Razorpay.');
      return;
    }

    try {
      const session = await axios.post(
        'https://smart-jankapur-backend.onrender.com/api/payments/checkout',
        {
          purchaseType: 'profile_viewer_unlock',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const order = session.data.order;

      if (!order) {
        alert('Payment order was not created.');
        return;
      }

      const options = {
        key: 'rzp_test_TcnnOXpowwNPle',
        amount: order.amount,
        currency: order.currency,
        name: 'Janakpur Hub',
        description: 'Unlock Visitor Insights List',
        order_id: order.id,

        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await axios.post(
              'https://smart-jankapur-backend.onrender.com/api/payments/verify',
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (verifyResponse.data.success) {
              alert('🎉 Analytics unlocked! Refreshing visitor feed...');
              fetchViewerAnalytics();
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert('Payment verification failed.');
          }
        },

        prefill: {
          name: user?.name || '',
          contact: user?.phoneNumber || '',
        },

        theme: {
          color: '#4f46e5',
        },

        modal: {
          ondismiss: function () {
            console.log('Razorpay payment window closed.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Checkout error:', err);
      alert(
        err.response?.data?.message || 'Checkout initiation error.'
      );
    }
  };

  const maskPhoneNumber = (num) => {
    if (!num) return '******';
    const phone = String(num);
    if (phone.length < 10) return '******';
    return `******${phone.slice(-4)}`;
  };

  return (
    <div className="space-y-6 w-full interstate-fade-in">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Classmate Directory 👥
          </h1>
          <p className="text-gray-500 text-xs">
            Search and connect with students across local village nodes.
          </p>
        </div>

        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow hover:bg-indigo-700 transition self-start sm:self-auto"
        >
          {isEditingProfile ? '✕ Close Workspace' : '📝 Customize My Card'}
        </button>
      </div>

      {/* PROFILE PANEL DRAWER INPUT LAYOUT */}
      {isEditingProfile && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4 animate-fade-in">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-indigo-700">
              Polishing Your Student Card
            </h2>
            <p className="text-[11px] text-gray-400">
              Update your classroom coordinates and write an introductory biography sentence.
            </p>
          </div>

          {editSuccess && (
            <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-xl">
              {editSuccess}
            </p>
          )}

          <form
            onSubmit={handleProfileUpdateSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-700"
          >
            <div>
              <label className="block mb-1">Class Section / Batch Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Class 10 - Section B"
                className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                value={editFormData.classOrBatch}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, classOrBatch: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block mb-1">Avatar Profile Picture URL</label>
              <input
                type="url"
                placeholder="Paste an image link url address..."
                className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                value={editFormData.profilePicture}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, profilePicture: e.target.value })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1">Personalized Card Bio Summary</label>
              <textarea
                maxLength="120"
                placeholder="Type something about yourself..."
                className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none h-16 resize-none font-medium"
                value={editFormData.bio}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, bio: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={editLoading}
              className="sm:col-span-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
            >
              {editLoading
                ? 'Saving data modifications...'
                : 'Update My Profile Card Metadata 📤'}
            </button>
          </form>
        </div>
      )}

      {/* MY PROFILE CONTAINER PREVIEW BANNER */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || 'User'
              )}&background=random`
            }
            alt="My Profile"
            className="w-14 h-14 rounded-full border-2 border-white object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg">My Profile Card: {user?.name}</h2>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Me
              </span>
            </div>
            <p className="text-xs text-indigo-100">
              {user?.schoolName} • {user?.classOrBatch || 'Class Level Not Pinned'}
            </p>
            <p className="text-xs italic text-indigo-200 mt-1">
              "{user?.bio || "You haven't compiled a biography. Click Customize to write one!"}"
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center self-stretch sm:self-auto flex flex-col justify-center">
          <p className="text-[10px] text-indigo-100 uppercase tracking-wider font-bold">
            My Dashboard Metrics
          </p>
          <p className="text-lg font-black mt-0.5">
            👁️ {analyticsData?.viewers?.length || 0} Profile Views
          </p>
        </div>
      </div>

      {/* PROFILE VISITORS TIMELINE FEED ROW LIST */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-800">Profile Analytics Tracker 📈</h3>
        {analyticsLoading ? (
          <p className="text-xs text-gray-400">Loading profile visitors...</p>
        ) : (
          <div>
            {analyticsData.viewers.length === 0 ? (
              <p className="text-xs text-gray-400">
                No classmates have viewed your card profile yet.
              </p>
            ) : (
              <div className="space-y-2">
                {analyticsData.viewers.map((viewer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border"
                  >
                    <div>
                      <p className="font-bold text-gray-800">
                        {analyticsData.unlocked
                          ? viewer.viewerId?.name || 'Anonymous Classmate'
                          : 'Classmate Visitor 🤫'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {analyticsData.unlocked && viewer.viewerId?.schoolName}
                        {analyticsData.unlocked &&
                          viewer.viewerId?.classOrBatch &&
                          ` • ${viewer.viewerId.classOrBatch}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Recent</span>
                  </div>
                ))}
              </div>
            )}

            {!analyticsData.unlocked && analyticsData.viewers.length > 0 && (
              <button
                onClick={processAnalyticsCheckout}
                className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl shadow hover:opacity-95 transition"
              >
                Unlock Visitor Names & Profiles for ₹29 💳
              </button>
            )}
          </div>
        )}
      </div>

      {/* SEARCH AND FILTER CRITERIA SLOTS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 Type classmate name to search..."
          className="flex-1 p-2.5 bg-white border rounded-xl text-xs font-bold outline-none shadow-sm"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <select
          className="p-2.5 bg-white border rounded-xl text-xs font-bold text-gray-700 outline-none w-full sm:w-56 shadow-sm"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="">All Village Institutions 🏫</option>
          <option value="Janakpur High School">Janakpur High School</option>
          <option value="Janakpur Primary School">Janakpur Primary School</option>
          <option value="Bodhi Bikash">Bodhi Bikash</option>
        </select>
      </div>

      {/* COMPILING DIRECTORY GRID LOOP ROW */}
      {loading ? (
        <p className="text-xs text-gray-500 font-bold text-center py-8">
          Fetching classmate directory...
        </p>
      ) : error ? (
        <p className="text-xs text-red-500 font-bold text-center py-8">{error}</p>
      ) : students.length === 0 ? (
        <p className="text-xs text-gray-400 font-bold text-center py-8">
          No classmates found matching criteria.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {students.map((student) => (
            <button
              key={student._id}
              onClick={() => handleProfileClickView(student._id, student.name)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center relative overflow-hidden shadow-sm hover:shadow-md transition outline-none"
            >
              <span className="absolute top-2 right-2 bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                Peer
              </span>

              <img
                src={
                  student.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    student.name
                  )}&background=random`
                }
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-50 mb-3"
              />

              <h4 className="font-bold text-sm text-gray-800">{student.name}</h4>
              <p className="text-xs text-indigo-600 font-medium">
                {student.classOrBatch || 'Classmate'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {student.schoolName}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-mono">
                ID: {maskPhoneNumber(student.phoneNumber)}
              </p>

              <p className="text-xs text-gray-600 italic mt-3 bg-gray-50 p-2 rounded-xl w-full">
                "{student.bio || 'Hello! I am using Janakpur Hub.'}"
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Directory;