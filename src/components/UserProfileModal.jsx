import React, { useState, useEffect } from 'react';
import { fetchUserProfileApi, recordProfileViewApi } from '../services/api';
import { resolveAvatarUrl } from '../utils/imageUtils';

function UserProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waved, setWaved] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setWaved(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    // Fetch full public profile + record view silently
    const loadProfileData = async () => {
      try {
        const res = await fetchUserProfileApi(userId);
        if (isMounted && res.data.success) {
          setProfile(res.data.data);
        }
        // Record profile view counter in background (silently)
        recordProfileViewApi(userId).catch(() => {});
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not load scholar profile.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, userId, onClose]);

  if (!isOpen) return null;

  const handleWave = () => {
    setWaved(true);
    setTimeout(() => setWaved(false), 3000);
  };

  const getAvatarUrl = (targetUser) => {
    return resolveAvatarUrl(targetUser, 'Classmate');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 transform transition-all animate-fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER WARM MOCHA & RADIANT GOLD BANNER */}
        <div className="relative bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 h-28 sm:h-32 p-4 flex justify-between items-start border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
              🏛️ Scholar Card
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close profile"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 -mt-14 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-b-indigo-600"></div>
              <p className="text-xs font-bold text-slate-400">Loading scholar card...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">⚠️</div>
              <p className="text-sm font-bold text-red-500">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              {/* AVATAR + BASIC INFO */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <div className="relative">
                  <img
                    src={getAvatarUrl(profile)}
                    alt={profile?.name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-100"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-stone-900 truncate">{profile?.name}</h3>
                    <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {profile?.role || 'Student'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-700 mt-0.5">
                    {profile?.classOrBatch || 'Class Section Not Pinned'}
                  </p>
                  <p className="text-[11px] text-stone-500 font-medium">
                    🏫 {profile?.schoolName}
                  </p>
                </div>
              </div>

              {/* METRICS ROW */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <p className="text-[10px] text-stone-500 uppercase font-black tracking-wide">Views</p>
                  <p className="text-lg font-black text-stone-900 mt-0.5">👁️ {profile?.profileViews || 0}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                  <p className="text-[10px] text-amber-800 uppercase font-black tracking-wide">Doubts & Posts</p>
                  <p className="text-lg font-black text-stone-900 mt-0.5">💬 {profile?.postsCount || 0}</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <p className="text-[10px] text-stone-500 uppercase font-black tracking-wide">Enrolled</p>
                  <p className="text-xs font-bold text-stone-700 mt-1">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026'}
                  </p>
                </div>
              </div>

              {/* BIO BOX */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider mb-1">Scholar Profile Bio</p>
                <p className="text-xs text-stone-700 font-medium italic leading-relaxed">
                  "{profile?.bio || 'Hello! I am an active student on Jankapur Hub.'}"
                </p>
              </div>

              {/* WAVE / INTERACTION BAR */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWave}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 ${
                    waved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <span>{waved ? '👋 Academic Wave Sent!' : `Wave 👋 at ${profile?.name?.split(' ')[0] || 'Classmate'}`}</span>
                </button>
              </div>

              {/* RECENT QUESTIONS / POSTS BY THIS STUDENT */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Recent Questions & Doubts ({profile?.recentPosts?.length || 0})
                  </h4>
                </div>

                {(!profile?.recentPosts || profile.recentPosts.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl font-medium">
                    This classmate has not shared any questions or posts yet.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {profile.recentPosts.map((post) => (
                      <div key={post._id} className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 transition space-y-1.5">
                        <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span className="text-indigo-700 font-bold">💬 {post.comments?.length || 0} solutions</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
