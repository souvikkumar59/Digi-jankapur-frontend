import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import {
  createSocket,
  fetchPostsApi,
  createPostApi,
  commentOnPostApi,
  toggleLikePostApi,
} from '../services/api';
import UserProfileModal from '../components/UserProfileModal';
import { resolveAvatarUrl, compressImageFile } from '../utils/imageUtils';

const TOPIC_OPTIONS = [
  { id: 'All', label: 'All Campus Feed 💬' },
  { id: 'General Notice', label: '📢 School Notices' },
  { id: 'Sports & Events', label: '🏆 Sports & Events' },
  { id: 'Math Doubt', label: '📐 Math Doubt' },
  { id: 'Science Doubt', label: '🔬 Science Doubt' },
  { id: 'Exam Prep', label: '📝 Madhyamik Prep' },
  { id: 'Homework Help', label: '📚 Homework Help' },
  { id: 'Career Guidance', label: '💡 Senior Advice' },
  { id: 'Lost & Found', label: '🔍 Lost & Found' },
];

const getRelativeTime = (dateString) => {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feed mode: 'all' discussions or 'my_questions' (1-click access for user's own doubts)
  const [feedMode, setFeedMode] = useState('all');

  // Post composer state
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [postTopic, setPostTopic] = useState('General Notice');
  const [postImage, setPostImage] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [notification, setNotification] = useState(null);

  // Student Profile Modal states
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const currentUserId = user?.id || user?._id;

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const getAvatarUrl = (targetUser) => {
    return resolveAvatarUrl(targetUser, 'Classmate');
  };

  const openUserProfile = (userOrId) => {
    if (!userOrId) return;
    const resolvedId = typeof userOrId === 'object' ? (userOrId._id || userOrId.id) : userOrId;
    if (!resolvedId) return;
    setSelectedUserId(resolvedId);
    setIsProfileModalOpen(true);
  };

  const fetchTimelineFeed = async () => {

    setLoading(true);
    setError('');
    try {
      const response = await fetchPostsApi({
        topic: selectedTopic !== 'All' ? selectedTopic : undefined,
      });
      if (response.data.success) {
        setPosts(response.data.data || []);
      }
    } catch (err) {
      setError('Could not refresh the community timeline. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Keep reference of current selectedTopic for the socket listener without causing socket reconnects
  const selectedTopicRef = useRef(selectedTopic);
  useEffect(() => {
    selectedTopicRef.current = selectedTopic;
  }, [selectedTopic]);

  // Fetch timeline when token or selectedTopic changes
  useEffect(() => {
    if (token) {
      fetchTimelineFeed();
    }
  }, [token, selectedTopic]);

  // REAL-TIME SOCKET HANDSHAKE (PERSISTENT PER SESSION)
  useEffect(() => {
    if (!token) return;

    const socket = createSocket();

    socket.on('doubt_updated', (updatedPost) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    });

    socket.on('new_post', (newPost) => {
      setPosts((prevPosts) => {
        if (prevPosts.some((p) => p._id === newPost._id)) return prevPosts;
        const currentFilter = selectedTopicRef.current;
        if (currentFilter === 'All' || newPost.topic === currentFilter) {
          return [newPost, ...prevPosts];
        }
        return prevPosts;
      });
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.on('connect', () => {
          socket.disconnect();
        });
      }
    };
  }, [token]);

  // Handle image attachment from device
  const handleImageAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    try {
      const compressed = await compressImageFile(file, 900, 900, 0.82);
      setPostImage(compressed);
      showToast('Photo attached! Click Share to publish.');
    } catch (err) {
      showToast('Failed to process image file.', 'error');
    } finally {
      setImageProcessing(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImage) return;

    setIsSubmitting(true);
    try {
      const response = await createPostApi({
        content: newPostContent.trim(),
        imageUrl: postImage || undefined,
        topic: postTopic,
      });

      if (response.data.success) {
        setNewPostContent('');
        setPostImage('');
        showToast('Your post was published to Jankapur High School Campus! ✨');
        fetchTimelineFeed();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish post.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;
        const likes = p.likes || [];
        const isLiked = likes.some((id) => id?.toString() === currentUserId?.toString());
        const updatedLikes = isLiked
          ? likes.filter((id) => id?.toString() !== currentUserId?.toString())
          : [...likes, currentUserId];
        return { ...p, likes: updatedLikes };
      })
    );

    try {
      const response = await toggleLikePostApi(postId);
      if (response.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p._id === postId ? response.data.data : p))
        );
      }
    } catch (err) {
      showToast('Failed to update upvote.', 'error');
      fetchTimelineFeed();
    }
  };

  const toggleCommentsDrawer = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const response = await commentOnPostApi(postId, text.trim());
      if (response.data.success) {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        showToast('Solution submitted to the scholar community! ✨');
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      showToast('Failed to submit solution.', 'error');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  // Compute questions asked by the logged-in student
  const myQuestions = posts.filter(
    (post) =>
      post.user?._id?.toString() === currentUserId?.toString() ||
      post.user?.toString() === currentUserId?.toString() ||
      post.user?.name === user?.name
  );

  const displayedPosts = feedMode === 'my_questions' ? myQuestions : posts;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 py-3 px-5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border animate-bounce ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-stone-900 text-amber-400 border-stone-800'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✨'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 🌟 JANKAPUR HIGH SCHOOL FLAGSHIP CAMPUS BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-6 sm:p-7 rounded-3xl shadow-xl text-white flex flex-col justify-between gap-5 border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <span>🏫 {t('brand.schoolTag', 'Jankapur High School (Class 5–12)')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>800 Scholars HQ</span>
              </span>
              <span className="text-[11px] text-stone-400 font-bold">• WBBSE & WBCHSE Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'bn' ? `নমস্কার, ${user?.name}! 👋` : `Namaskar, ${user?.name}! 👋`}
            </h1>
            <p className="text-stone-300 text-xs mt-1 font-medium">
              {language === 'bn' 
                ? 'জানকাপুর হাই স্কুলের অফিশিয়াল ডিজিটাল ক্যাম্পাস ও সহপাঠী নেটওয়ার্কে আপনাকে স্বাগতম।' 
                : 'Welcome to the official digital campus and peer network of Jankapur High School.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => openUserProfile(currentUserId)}
              className="bg-stone-800/90 hover:bg-stone-700 text-amber-300 border border-stone-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 transform active:scale-95"
            >
              <span>👤 {language === 'bn' ? 'আমার স্কলার কার্ড' : 'My Scholar Card'}</span>
              <span>↗</span>
            </button>
          </div>
        </div>

        {/* 🚀 QUICK CAMPUS ACTION BAR */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-stone-800">
          <button
            onClick={() => navigate('/quizzes')}
            className="p-2.5 bg-stone-800/80 hover:bg-stone-800 hover:border-amber-400/60 border border-stone-700 rounded-2xl text-left transition group"
          >
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {t('dashboard.quickMock', 'Mock Exam Hall')}
            </p>
            <p className="text-xs font-black text-white group-hover:text-amber-300 mt-0.5 flex items-center justify-between">
              <span>{t('dashboard.quickTakeTest', 'Take Test 📝')}</span>
              <span className="text-[10px] text-stone-400">→</span>
            </p>
          </button>

          <button
            onClick={() => navigate('/library')}
            className="p-2.5 bg-stone-800/80 hover:bg-stone-800 hover:border-amber-400/60 border border-stone-700 rounded-2xl text-left transition group"
          >
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {t('dashboard.quickVault', 'Learning Vault')}
            </p>
            <p className="text-xs font-black text-white group-hover:text-amber-300 mt-0.5 flex items-center justify-between">
              <span>{t('dashboard.quickPyqs', 'Solved PYQs 📜')}</span>
              <span className="text-[10px] text-stone-400">→</span>
            </p>
          </button>

          <button
            onClick={() => navigate('/directory')}
            className="p-2.5 bg-stone-800/80 hover:bg-stone-800 hover:border-amber-400/60 border border-stone-700 rounded-2xl text-left transition group"
          >
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {t('dashboard.quickDirectory', 'Classmate Directory')}
            </p>
            <p className="text-xs font-black text-white group-hover:text-amber-300 mt-0.5 flex items-center justify-between">
              <span>{t('dashboard.quickPeers', '800 Peers 👥')}</span>
              <span className="text-[10px] text-stone-400">→</span>
            </p>
          </button>

          <button
            onClick={() => setFeedMode('my_questions')}
            className="p-2.5 bg-stone-800/80 hover:bg-stone-800 hover:border-amber-400/60 border border-stone-700 rounded-2xl text-left transition group"
          >
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {t('dashboard.quickMyActivity', 'My Activity')}
            </p>
            <p className="text-xs font-black text-white group-hover:text-amber-300 mt-0.5 flex items-center justify-between">
              <span>{t('dashboard.quickMyDoubts', 'My Doubts ⭐')} ({myQuestions.length})</span>
              <span className="text-[10px] text-stone-400">→</span>
            </p>
          </button>
        </div>

        {/* FEED MODE SWITCHER */}
        <div className="relative z-10 flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => {
              setFeedMode('all');
              setSelectedTopic('All');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              feedMode === 'all'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/25'
                : 'bg-stone-800/90 text-stone-300 hover:text-white border border-stone-700'
            }`}
          >
            {t('dashboard.feedAll', '🌐 All Campus Feed')} ({posts.length})
          </button>
          <button
            onClick={() => setFeedMode('my_questions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              feedMode === 'my_questions'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/25'
                : 'bg-stone-800/90 text-amber-300 hover:text-white border border-stone-700'
            }`}
          >
            <span>{t('dashboard.feedMyQuestions', '🙋‍♂️ My Questions')}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              feedMode === 'my_questions' ? 'bg-stone-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {myQuestions.length}
            </span>
          </button>
        </div>
      </div>

      {/* 🏫 JANKAPUR HIGH SCHOOL UPDATES GATEWAY BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3.5">
          <span className="text-3xl p-3 bg-stone-800/90 border border-stone-700 rounded-2xl text-amber-400 shadow shrink-0">
            🏫
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h2 className="text-base font-black tracking-tight text-white">
                {t('dashboard.gatewayTitle', 'Jankapur High School Official Notice Board & Updates')}
              </h2>
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                {t('dashboard.gatewayTag', 'Live Portal')}
              </span>
            </div>
            <p className="text-xs text-stone-300 font-medium">
              {t('dashboard.gatewayDesc', 'Official school notices, weekly match polls, daily logic boosters, and scholar spotlight.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/campus')}
          className="relative z-10 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black rounded-xl shadow-lg transition self-stretch sm:self-auto text-center transform active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
        >
          <span>{t('dashboard.gatewayBtn', 'Open JHS Updates')}</span>
          <span>➔</span>
        </button>
      </div>


      {/* QUICK JUMP TO USER'S QUESTIONS BANNER */}
      {myQuestions.length > 0 && feedMode !== 'my_questions' && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🙋‍♂️</span>
            <div>
              <p className="text-xs font-black text-amber-950">
                You have asked <span className="underline decoration-amber-500">{myQuestions.length} question{myQuestions.length === 1 ? '' : 's'}</span> in the community.
              </p>
              <p className="text-[11px] text-amber-800/90 font-medium">
                Want to check answers or follow up on your questions?
              </p>
            </div>
          </div>
          <button
            onClick={() => setFeedMode('my_questions')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow-sm transition self-stretch sm:self-auto text-center"
          >
            View My Questions ⭐
          </button>
        </div>
      )}

      {/* CREATE POST / ASK DOUBT WINDOW PANEL */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-stone-200 hover:border-amber-400/80 transition duration-200 space-y-4">
        <form onSubmit={handlePostSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-amber-600">💬</span> {t('dashboard.askDoubtTitle', 'Ask a Doubt, Share Homework, or Post Campus Update')}
            </label>

            {/* TOPIC SELECTOR */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-500">{t('dashboard.filterTopic', 'Topic')}:</span>
              <select
                value={postTopic}
                onChange={(e) => setPostTopic(e.target.value)}
                className="p-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="General Notice">📢 {language === 'bn' ? 'স্কুল নোটিশ' : 'School Notice'}</option>
                <option value="Sports & Events">🏆 {language === 'bn' ? 'খেলাধুলো ও অনুষ্ঠান' : 'Sports & Events'}</option>
                <option value="Math Doubt">📐 {language === 'bn' ? 'অঙ্কের ডাউট' : 'Math Doubt'}</option>
                <option value="Science Doubt">🔬 {language === 'bn' ? 'বিজ্ঞানের ডাউট' : 'Science Doubt'}</option>
                <option value="Exam Prep">📝 {language === 'bn' ? 'মাধ্যমিক প্রস্তুতি' : 'Madhyamik Prep'}</option>
                <option value="Homework Help">📚 {language === 'bn' ? 'হোমওয়ার্ক সাহায্য' : 'Homework Help'}</option>
                <option value="Career Guidance">💡 {language === 'bn' ? 'সিনিয়রদের পরামর্শ' : 'Senior Advice'}</option>
                <option value="Lost & Found">🔍 {language === 'bn' ? 'হারানো ও প্রাপ্তি' : 'Lost & Found'}</option>
              </select>
            </div>
          </div>

          <textarea
            rows="3"
            placeholder={t('dashboard.postPlaceholder', 'Type your study doubt, share a football match score, report a lost item, or ask seniors for advice...')}
            className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium text-sm text-stone-900 resize-none transition placeholder:text-stone-400"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />

          {/* ATTACHED IMAGE PREVIEW */}
          {postImage && (
            <div className="relative inline-block mt-2">
              <img
                src={postImage}
                alt="Attachment Preview"
                className="max-h-48 rounded-2xl border-2 border-stone-200 shadow-sm object-cover"
              />
              <button
                type="button"
                onClick={() => setPostImage('')}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold shadow"
              >
                ✕
              </button>
            </div>
          )}

          {/* COMPOSER TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 transform active:scale-95">
                <span>{language === 'bn' ? '📷 ছবি যুক্ত করুন' : '📷 Attach Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageAttachment}
                />
              </label>

              {imageProcessing && (
                <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-600 border-t-transparent" />
                  {language === 'bn' ? 'ছবি প্রক্রিয়াকরণ হচ্ছে...' : 'Compressing photo...'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!newPostContent.trim() && !postImage)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 select-none transition transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t('dashboard.posting', 'Publishing...') : (language === 'bn' ? 'ক্যাম্পাসে পোস্ট করুন 🎓' : 'Share with Campus 🎓')}
            </button>
          </div>
        </form>
      </div>

      {/* TOPIC FILTER PILLS BAR (Shown in All Discussions mode) */}
      {feedMode === 'all' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
              <span>🏷️</span> Explore Campus Channels
            </h2>
            <button
              onClick={fetchTimelineFeed}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold transition flex items-center gap-1"
            >
              🔄 Refresh Feed
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TOPIC_OPTIONS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition ${
                  selectedTopic === topic.id
                    ? 'bg-stone-900 text-amber-400 border border-stone-800 font-black shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODE TITLE IN MY QUESTIONS */}
      {feedMode === 'my_questions' && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-stone-200">
          <div>
            <h2 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <span>🙋‍♂️ Questions Asked by You</span>
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                {myQuestions.length} Total
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Easily track all your questions, solutions, and answers in one place.
            </p>
          </div>
          <button
            onClick={() => setFeedMode('all')}
            className="text-xs text-amber-700 hover:text-amber-900 font-bold hover:underline"
          >
            ← View All Campus Feed
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-2xl border border-red-200">
          {error}
        </p>
      )}

      {/* TIMELINE FEED */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-200 border-b-amber-500"></div>
          <p className="text-xs text-stone-400 font-bold">Loading questions & discussions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedPosts.length === 0 ? (
            <div className="bg-white text-center py-14 rounded-3xl border border-dashed border-stone-300 text-stone-500 text-sm font-medium p-8">
              <div className="text-4xl mb-3">{feedMode === 'my_questions' ? '🙋‍♂️' : '📜'}</div>
              <p className="font-black text-stone-900 text-base">
                {feedMode === 'my_questions'
                  ? "You haven't asked any questions yet."
                  : 'No posts in this topic channel yet.'}
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                {feedMode === 'my_questions'
                  ? 'Have a doubt in Math, Science, or Homework? Type your question above and your classmates & teachers will reply with solutions!'
                  : 'Be the first scholar to ask a question, share a match score, or post notes in this channel!'}
              </p>
            </div>
          ) : (
            displayedPosts.map((post) => {
              const likes = post.likes || [];
              const isLiked = likes.some((id) => id?.toString() === currentUserId?.toString());
              const isMyPost =
                post.user?._id?.toString() === currentUserId?.toString() ||
                post.user?.toString() === currentUserId?.toString() ||
                post.user?.name === user?.name;

              return (
                <div
                  key={post._id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition duration-200 space-y-4 ${
                    isMyPost
                      ? 'border-amber-400/80 ring-1 ring-amber-300/50'
                      : 'border-stone-200'
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between">
                    <button
                      type="button"
                      onClick={() => openUserProfile(post.user?._id || post.user)}
                      className="flex items-center space-x-3 text-left group cursor-pointer"
                    >
                      <img
                        src={getAvatarUrl(post.user)}
                        alt={post.user?.name || 'Classmate'}
                        className="w-10 h-10 rounded-full border-2 border-amber-400/80 shadow-sm object-cover group-hover:scale-105 transition"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-black text-stone-900 group-hover:text-amber-800 transition">
                            {post.user?.name || 'Fellow Scholar'}
                          </h3>
                          {isMyPost && (
                            <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[9px] px-2 py-0.2 rounded-full font-black uppercase tracking-wider">
                              Asked by You ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {post.user?.classOrBatch || 'Scholar'} • {post.user?.schoolName || 'Jankapur High School'}
                        </p>
                      </div>
                    </button>

                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        {post.topic || 'General Notice'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {getRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* POST BODY CONTENT */}
                  <div className="text-stone-800 text-sm font-medium leading-relaxed whitespace-pre-wrap pl-1">
                    {post.content}
                  </div>

                  {/* ATTACHED IMAGE (IF PRESENT) */}
                  {post.imageUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                      <img
                        src={post.imageUrl}
                        alt="Question attachment"
                        className="max-h-96 w-full object-contain bg-black/5"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* POST ACTION BAR (LIKES + COMMENTS TOGGLE) */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-600">
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      className={`flex items-center space-x-1.5 font-black px-3 py-1.5 rounded-xl transition ${
                        isLiked
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'hover:bg-stone-100 text-stone-600 border border-transparent'
                      }`}
                    >
                      <span>{isLiked ? '👍 Upvoted' : '👍 Upvote'}</span>
                      <span className="font-bold text-stone-900">({likes.length})</span>
                    </button>

                    <button
                      onClick={() => toggleCommentsDrawer(post._id)}
                      className="flex items-center space-x-1.5 font-bold hover:text-stone-950 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition"
                    >
                      <span>💬 {post.comments?.length || 0} Solutions / Answers</span>
                    </button>
                  </div>

                  {/* COMMENTS DRAWER */}
                  {expandedComments[post._id] && (
                    <div className="pt-3 border-t border-stone-150 space-y-3 bg-stone-50/70 -mx-5 -mb-5 p-5 rounded-b-3xl">
                      <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Peer Solutions & Explanations ({post.comments?.length || 0})
                      </h4>

                      {post.comments && post.comments.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {post.comments.map((comment, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => openUserProfile(comment.user?._id || comment.user)}
                                  className="flex items-center space-x-1.5 text-left group cursor-pointer"
                                >
                                  <span className="text-xs font-black text-stone-900 group-hover:text-amber-700 transition">
                                    {comment.user?.name || 'Classmate'}
                                  </span>
                                  <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                                    {comment.user?.role || 'student'}
                                  </span>
                                </button>
                                <span className="text-[9px] text-stone-400 font-medium">
                                  {getRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-stone-700 font-medium leading-relaxed pl-0.5">
                                {comment.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 italic">
                          No answers submitted yet. Help your classmate with a solution!
                        </p>
                      )}

                      {/* ADD COMMENT INPUT */}
                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="text"
                          placeholder="Provide a step-by-step solution..."
                          className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 outline-none text-xs font-semibold focus:ring-2 focus:ring-amber-500 text-stone-900 transition"
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => handleCommentChange(post._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommentSubmit(post._id);
                          }}
                        />
                        <button
                          onClick={() => handleCommentSubmit(post._id)}
                          disabled={commentLoading[post._id] || !commentInputs[post._id]?.trim()}
                          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-xl shadow active:scale-95 transition disabled:opacity-50"
                        >
                          {commentLoading[post._id] ? '...' : 'Reply 📤'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* STUDENT PROFILE MODAL */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
