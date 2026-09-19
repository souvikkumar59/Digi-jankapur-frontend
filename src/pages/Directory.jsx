import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  fetchDirectoryApi,
  fetchProfileAnalyticsApi,
  updateUserProfileApi,
  createPaymentCheckoutApi,
  verifyPaymentApi,
} from '../services/api';
import UserProfileModal from '../components/UserProfileModal';
import { compressImageFile, resolveAvatarUrl } from '../utils/imageUtils';

const presetAvatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Toby',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
];

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

  // Student Profile Modal states
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    unlocked: false,
    viewers: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getStudentAvatar = (student) => {
    return resolveAvatarUrl(student, student?.name || 'Student');
  };

  // Handle direct file upload from device
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.85);
      setEditFormData((prev) => ({
        ...prev,
        profilePicture: compressed,
      }));
      showToast('Photo selected! Click "Save Scholar Card" to update.');
    } catch (err) {
      showToast(err.message || 'Failed to process image.', 'error');
    } finally {
      setImageProcessing(false);
    }
  };

  // Fetch classmates directory
  const fetchDirectory = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchDirectoryApi({
        schoolName: schoolFilter || undefined,
        name: searchName || undefined,
      });

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
      const response = await fetchProfileAnalyticsApi();

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
      showToast('Please login first.', 'error');
      return;
    }

    setEditLoading(true);
    setEditSuccess('');

    try {
      const response = await updateUserProfileApi(editFormData);

      if (response.data.success) {
        setEditSuccess('Your scholar card has been polished successfully! 🎓');

        const updatedUserMetadata = {
          ...user,
          ...response.data.data,
        };

        login(updatedUserMetadata, token);

        setTimeout(() => {
          setIsEditingProfile(false);
          setEditSuccess('');
          fetchDirectory();
        }, 1200);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Profile update failed.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleStudentCardClick = (studentId) => {
    setSelectedStudentId(studentId);
    setIsProfileModalOpen(true);
  };

  // Razorpay checkout for unlocking analytics
  const processAnalyticsCheckout = async () => {
    if (!token) {
      showToast('Please login first.', 'error');
      return;
    }

    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      showToast('Failed to connect to payment gateway.', 'error');
      return;
    }

    try {
      const session = await createPaymentCheckoutApi({
        purchaseType: 'profile_viewer_unlock',
      });

      const order = session.data.order;

      if (!order) {
        showToast('Payment order was not created.', 'error');
        return;
      }

      const options = {
        key: 'rzp_test_TcnnOXpowwNPle',
        amount: order.amount,
        currency: order.currency,
        name: 'Jankapur Hub',
        description: 'Unlock Visitor Insights List',
        order_id: order.id,

        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await verifyPaymentApi({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              showToast('🎉 Analytics unlocked! Refreshing visitor feed...');
              fetchViewerAnalytics();
            } else {
              showToast('Payment verification failed.', 'error');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            showToast('Payment verification failed.', 'error');
          }
        },

        prefill: {
          name: user?.name || '',
          contact: user?.phoneNumber || '',
        },

        theme: {
          color: '#0f243d',
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
      showToast(err.response?.data?.message || 'Checkout initiation error.', 'error');
    }
  };

  const maskPhoneNumber = (num) => {
    if (!num) return '******';
    const phone = String(num);
    if (phone.length < 10) return '******';
    return `******${phone.slice(-4)}`;
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* NOTIFICATION TOAST */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 py-3 px-5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '⚠️' : '✨'}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Classmate Directory 👥
            </h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Scholars
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Search, connect, and view student cards across village institutions.
          </p>
        </div>

        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition self-start sm:self-auto transform active:scale-95"
        >
          {isEditingProfile ? '✕ Close Workspace' : '📝 Customize My Card'}
        </button>
      </div>

      {/* PROFILE PANEL DRAWER INPUT LAYOUT */}
      {isEditingProfile && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Polishing Your Scholar Card 🎓
              </h2>
              <p className="text-[11px] text-slate-500">
                Update your class section, bio summary, and upload your profile photo.
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">Live Preview</span>
          </div>

          {editSuccess && (
            <p className="text-emerald-700 text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              {editSuccess}
            </p>
          )}

          <form
            onSubmit={handleProfileUpdateSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700"
          >
            <div>
              <label className="block mb-1 text-slate-700">Class Section / Batch</label>
              <input
                type="text"
                required
                placeholder="e.g. Class 10 - Section B"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
                value={editFormData.classOrBatch}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, classOrBatch: e.target.value })
                }
              />
            </div>

            {/* AVATAR SELECTOR / UPLOADER */}
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={
                    editFormData.profilePicture
                      ? resolveAvatarUrl({ profilePicture: editFormData.profilePicture, name: user?.name })
                      : resolveAvatarUrl(user)
                  }
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md bg-white"
                />
                {imageProcessing && (
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-xs font-black text-slate-900">Profile Picture / Avatar</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Upload a photo from your computer/phone gallery (JPEG, PNG, WEBP), or select an avatar preset below.
                </p>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center pt-1">
                  <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 transform active:scale-95">
                    <span>📷 Choose Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                  </label>

                  {editFormData.profilePicture && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, profilePicture: '' })}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PRESET AVATARS */}
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">Or choose an avatar character:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {presetAvatars.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setEditFormData({ ...editFormData, profilePicture: preset })}
                    className={`w-10 h-10 rounded-xl border-2 overflow-hidden transition transform hover:scale-110 shrink-0 bg-white ${
                      editFormData.profilePicture === preset ? 'border-indigo-600 ring-2 ring-indigo-400' : 'border-slate-200'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-slate-700">Card Bio Summary</label>
              <textarea
                maxLength="140"
                placeholder="Write a short scholarly summary about yourself..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20 resize-none font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                value={editFormData.bio}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, bio: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={editLoading}
              className="sm:col-span-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition disabled:opacity-50"
            >
              {editLoading ? 'Saving changes...' : 'Save Scholar Card 📤'}
            </button>
          </form>
        </div>
      )}

      {/* MY PROFILE CONTAINER PREVIEW BANNER - SOLID DARK HIGH-CONTRAST */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <img
            src={getStudentAvatar(user)}
            alt="My Profile"
            className="w-16 h-16 rounded-2xl border-2 border-indigo-400 object-cover shadow-md bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-xl text-white">{user?.name}</h2>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-2.5 py-0.5 rounded-full font-black uppercase">
                You
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {user?.schoolName} • <span className="text-indigo-400 font-bold">{user?.classOrBatch || 'Class Level Not Set'}</span>
            </p>
            <p className="text-xs italic text-slate-300 mt-1 max-w-md">
              "{user?.bio || "You haven't added a biography. Click Customize to write one!"}"
            </p>
          </div>
        </div>

        <div className="relative z-10 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700 text-center self-stretch sm:self-auto flex flex-col justify-center">
          <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-black">
            Card Popularity
          </p>
          <p className="text-lg font-black mt-0.5 text-white">
            👁️ {analyticsData?.viewers?.length || 0} Views
          </p>
        </div>
      </div>

      {/* PROFILE VISITORS TIMELINE FEED */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Profile Visitors & Insights 📈</h3>
          <span className="text-[10px] font-bold text-slate-400">Classmates who viewed your card</span>
        </div>

        {analyticsLoading ? (
          <p className="text-xs text-slate-400 font-medium py-2">Checking visitor history...</p>
        ) : (
          <div>
            {analyticsData.viewers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-2xl text-center font-medium">
                No classmates have viewed your card profile yet.
              </p>
            ) : (
              <div className="space-y-2">
                {analyticsData.viewers.map((viewer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-xs border border-slate-200"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {analyticsData.unlocked
                          ? viewer.viewerId?.name || 'Anonymous Classmate'
                          : 'Classmate Visitor 🤫'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {analyticsData.unlocked && viewer.viewerId?.schoolName}
                        {analyticsData.unlocked &&
                          viewer.viewerId?.classOrBatch &&
                          ` • ${viewer.viewerId.classOrBatch}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      Recent View
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!analyticsData.unlocked && analyticsData.viewers.length > 0 && (
              <button
                onClick={processAnalyticsCheckout}
                className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg transition"
              >
                Unlock Visitor Names & Profiles for ₹29 💳
              </button>
            )}
          </div>
        )}
      </div>

      {/* SEARCH AND FILTER CRITERIA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 Type classmate name to search..."
          className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <select
          className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-indigo-500"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="">All Village Institutions 🏫</option>
          <option value="Jankapur High School">Jankapur High School</option>
          <option value="Jankapur Primary School">Jankapur Primary School</option>
          <option value="Bodhi Bikash">Bodhi Bikash</option>
          <option value="Jankapur High Madrasha">Jankapur High Madrasha</option>
        </select>
      </div>

      {/* DIRECTORY GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-b-indigo-600"></div>
          <p className="text-xs text-slate-400 font-bold">Fetching classmate cards...</p>
        </div>
      ) : error ? (
        <p className="text-xs text-red-500 font-bold text-center py-8">{error}</p>
      ) : students.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm font-bold text-slate-700">No classmates found matching criteria.</p>
          <p className="text-xs mt-1">Try clearing your search query or selecting All Schools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student._id}
              onClick={() => handleStudentCardClick(student._id)}
              className="w-full bg-white rounded-3xl border border-stone-200 p-5 flex flex-col items-center text-center relative overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400 transition duration-200 cursor-pointer group"
            >
              <span className="absolute top-3 right-3 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {student.role || 'Peer'}
              </span>

              <div className="relative mb-3 mt-1">
                <img
                  src={getStudentAvatar(student)}
                  alt={student.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-100 group-hover:border-amber-500 shadow-sm group-hover:scale-105 transition bg-stone-50"
                />
              </div>

              <h4 className="font-black text-sm text-stone-900 group-hover:text-amber-700 transition">
                {student.name}
              </h4>
              <p className="text-xs text-amber-700 font-bold mt-0.5">
                {student.classOrBatch || 'Classmate'}
              </p>
              <p className="text-[11px] text-stone-500 font-medium">
                {student.schoolName}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 font-mono">
                ID: {maskPhoneNumber(student.phoneNumber)}
              </p>

              <p className="text-xs text-stone-600 italic mt-3 bg-stone-50 p-2.5 rounded-2xl w-full line-clamp-2 border border-stone-100">
                "{student.bio || 'Hello! I am using Jankapur Hub.'}"
              </p>

              <button
                type="button"
                className="mt-3 w-full py-2 bg-stone-900 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-white font-black rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow"
              >
                <span>View Full Profile</span>
                <span>↗</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* STUDENT PROFILE MODAL */}
      <UserProfileModal
        userId={selectedStudentId}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          fetchViewerAnalytics();
        }}
      />
    </div>
  );
}

export default Directory;