import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchNoticesApi,
  createNoticeApi,
  updateNoticeApi,
  deleteNoticeApi,
  fetchCampusDataApi,
  updatePollApi,
  votePollApi,
  updateRiddleApi,
  createSpotlightApi,
  updateSpotlightApi,
  deleteSpotlightApi,
} from '../services/api';

function CampusUpdates() {
  const { user } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const isFaculty = isAdmin || user?.role === 'teacher';

  // NOTICES STATE
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    badge: 'MADHYAMIK 2025',
    dateText: 'Today',
    schoolTag: 'Jankapur High School',
  });

  // CAMPUS DATA STATE (POLL, RIDDLE, WALL OF FAME)
  const [campusData, setCampusData] = useState(null);
  const [loadingCampus, setLoadingCampus] = useState(true);
  const [campusTab, setCampusTab] = useState('poll'); // 'poll' | 'riddle'
  const [showTeaserAnswer, setShowTeaserAnswer] = useState(false);

  // MODAL STATES
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollForm, setPollForm] = useState({
    question: '',
    badge: '',
    options: [],
    resetVotes: false,
  });

  const [showRiddleModal, setShowRiddleModal] = useState(false);
  const [riddleForm, setRiddleForm] = useState({
    question: '',
    subtext: '',
    answer: '',
  });

  const [showSpotlightModal, setShowSpotlightModal] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState(null);
  const [spotlightForm, setSpotlightForm] = useState({
    name: '',
    title: '',
    description: '',
    icon: '⚽',
    color: 'amber',
  });

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. FETCH NOTICES
  const loadNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await fetchNoticesApi();
      if (res.data.success) {
        setNotices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load notices', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  // 2. FETCH CAMPUS WIDGET DATA
  const loadCampusData = async () => {
    setLoadingCampus(true);
    try {
      const res = await fetchCampusDataApi();
      if (res.data.success) {
        setCampusData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campus data', err);
    } finally {
      setLoadingCampus(false);
    }
  };

  useEffect(() => {
    loadNotices();
    loadCampusData();
  }, []);

  // --- NOTICE ACTIONS ---
  const handleOpenCreateNotice = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      content: '',
      badge: 'MADHYAMIK 2025',
      dateText: 'Today',
      schoolTag: 'Jankapur High School',
    });
    setShowNoticeModal(true);
  };

  const handleOpenEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title || '',
      content: notice.content || '',
      badge: notice.badge || 'GENERAL NOTICE',
      dateText: notice.dateText || 'Today',
      schoolTag: notice.schoolTag || 'Jankapur High School',
    });
    setShowNoticeModal(true);
  };

  const handleSaveNotice = async (e) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        const res = await updateNoticeApi(editingNotice._id, noticeForm);
        if (res.data.success) {
          showToast('Notice updated successfully!');
          loadNotices();
        }
      } else {
        const res = await createNoticeApi(noticeForm);
        if (res.data.success) {
          showToast('New notice published!');
          loadNotices();
        }
      }
      setShowNoticeModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save notice.');
    }
  };

  const handleDeleteNotice = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete notice "${title}"?`)) return;
    try {
      const res = await deleteNoticeApi(id);
      if (res.data.success) {
        showToast('Notice deleted.');
        setNotices((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notice.');
    }
  };

  // --- POLL ACTIONS ---
  const handleOpenEditPoll = () => {
    if (!campusData?.poll) return;
    setPollForm({
      question: campusData.poll.question || '',
      badge: campusData.poll.badge || '',
      options: campusData.poll.options.map((o) => ({ id: o.id, label: o.label, votes: o.votes })),
      resetVotes: false,
    });
    setShowPollModal(true);
  };

  const handleSavePoll = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePollApi(pollForm);
      if (res.data.success) {
        showToast('Match Poll updated successfully!');
        loadCampusData();
        setShowPollModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update poll.');
    }
  };

  const handleVotePoll = async (optionId) => {
    const currentUserId = user?.id || user?._id;
    if (campusData?.poll?.voters?.includes(currentUserId?.toString())) {
      showToast('You have already cast your vote in this poll!');
      return;
    }
    try {
      const res = await votePollApi(optionId);
      if (res.data.success) {
        showToast('Your vote has been counted! 🏆');
        loadCampusData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Already voted in this poll.');
    }
  };

  // --- RIDDLE ACTIONS ---
  const handleOpenEditRiddle = () => {
    if (!campusData?.riddle) return;
    setRiddleForm({
      question: campusData.riddle.question || '',
      subtext: campusData.riddle.subtext || '',
      answer: campusData.riddle.answer || '',
    });
    setShowRiddleModal(true);
  };

  const handleSaveRiddle = async (e) => {
    e.preventDefault();
    try {
      const res = await updateRiddleApi(riddleForm);
      if (res.data.success) {
        showToast('Daily Riddle updated successfully!');
        loadCampusData();
        setShowRiddleModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update riddle.');
    }
  };

  // --- SPOTLIGHT ACTIONS ---
  const handleOpenCreateSpotlight = () => {
    setEditingSpotlight(null);
    setSpotlightForm({
      name: '',
      title: '',
      description: '',
      icon: '⚽',
      color: 'amber',
    });
    setShowSpotlightModal(true);
  };

  const handleOpenEditSpotlight = (spotlight) => {
    setEditingSpotlight(spotlight);
    setSpotlightForm({
      name: spotlight.name || '',
      title: spotlight.title || '',
      description: spotlight.description || '',
      icon: spotlight.icon || '⭐',
      color: spotlight.color || 'amber',
    });
    setShowSpotlightModal(true);
  };

  const handleSaveSpotlight = async (e) => {
    e.preventDefault();
    try {
      if (editingSpotlight) {
        const res = await updateSpotlightApi(editingSpotlight._id, spotlightForm);
        if (res.data.success) {
          showToast('Spotlight student updated!');
          loadCampusData();
        }
      } else {
        const res = await createSpotlightApi(spotlightForm);
        if (res.data.success) {
          showToast('Student added to Wall of Fame!');
          loadCampusData();
        }
      }
      setShowSpotlightModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save spotlight.');
    }
  };

  const handleDeleteSpotlight = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from Wall of Fame?`)) return;
    try {
      const res = await deleteSpotlightApi(id);
      if (res.data.success) {
        showToast('Spotlight removed.');
        loadCampusData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete spotlight.');
    }
  };

  const poll = campusData?.poll;
  const riddle = campusData?.riddle;
  const spotlights = campusData?.spotlights || [];
  const totalPollVotes = poll?.options?.reduce((acc, curr) => acc + (curr.votes || 0), 0) || 0;
  const hasUserVoted = poll?.voters?.includes((user?.id || user?._id)?.toString());

  return (
    <div className="space-y-6 w-full animate-fade-in pb-12">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 py-3 px-5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border bg-stone-900 text-amber-400 border-stone-800 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 HERO BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-6 sm:p-7 rounded-3xl shadow-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <span>🏫 {t('brand.schoolTag', 'Jankapur High School (Class 5–12)')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('brand.campus', 'Official Campus Updates')}</span>
            </span>
            {isAdmin && (
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                ⚡ Admin CMS Mode (Don)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('campus.heroTitle', 'Jankapur High School Updates Hub')}
          </h1>
          <p className="text-stone-300 text-xs mt-1 font-medium max-w-xl">
            {t('campus.heroDesc', 'Real-time official notice board, school sports & match polls, daily 1-minute brain boosters, and the Wall of Fame celebrating our 800 scholars.')}
          </p>
        </div>

        {isFaculty && (
          <button
            onClick={handleOpenCreateNotice}
            className="relative z-10 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 px-4 py-2.5 rounded-2xl text-xs font-black transition shadow-lg flex items-center gap-2 transform active:scale-95"
          >
            <span>{t('campus.postNoticeBtn', '➕ Post New Notice')}</span>
          </button>
        )}
      </div>

      {/* 📌 OFFICIAL NOTICE BOARD SECTION */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-150 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h2 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
              <span>📢</span>
              <span>{t('campus.noticesHeading', 'Official Notice Board')}</span>
            </h2>
            <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
              {notices.length} {language === 'bn' ? 'টি সক্রিয় নোটিশ' : 'Active Notices'}
            </span>
          </div>

          {isFaculty && (
            <button
              onClick={handleOpenCreateNotice}
              className="text-xs font-black text-stone-700 hover:text-stone-950 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center gap-1"
            >
              <span>{t('campus.postNoticeBtn', '➕ Add Notice')}</span>
            </button>
          )}
        </div>

        {loadingNotices ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-200 border-b-amber-500"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs font-bold">
            {t('campus.noNotices', 'No official school notices published yet.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {notices.map((notice) => {
              const canModify = isAdmin || (notice.postedBy?._id === (user?.id || user?._id));

              return (
                <div
                  key={notice._id}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between hover:border-amber-400 transition group relative space-y-2"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                        {notice.badge || 'GENERAL'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold">
                        {notice.dateText || 'Today'}
                      </span>
                    </div>

                    <h3 className="text-xs font-black text-stone-900 leading-snug pt-0.5">
                      {notice.title}
                    </h3>

                    <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                      {notice.content}
                    </p>
                  </div>

                  {canModify && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-200/60">
                      <button
                        onClick={() => handleOpenEditNotice(notice)}
                        title="Edit Notice"
                        className="px-2 py-1 text-[10px] font-black text-stone-600 hover:text-amber-800 bg-white hover:bg-amber-50 border border-stone-200 rounded-lg transition"
                      >
                        ✏️ {t('common.edit', 'Edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice._id, notice.title)}
                        title="Delete Notice"
                        className="px-2 py-1 text-[10px] font-black text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                      >
                        🗑️ {t('common.delete', 'Delete')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🗳️ CAMPUS LIFE (MATCH POLL & DAILY RIDDLE) + 🏆 WALL OF FAME */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT 2 COLUMNS: POLL & RIDDLE */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-150 pb-3">
            <div>
              <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                <span>🎯 {t('campus.pollTab', 'Campus Life & Daily Challenge')}</span>
              </h2>
              <p className="text-[11px] text-stone-500">
                {language === 'bn' ? 'শিক্ষার্থীদের মতামত, খেলাধুলো অনুমান এবং লজিক ধাঁধা।' : 'Interactive student voice, sports predictions, and logic teasers.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && campusTab === 'poll' && (
                <button
                  onClick={handleOpenEditPoll}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-stone-900 text-xs font-black rounded-xl border border-amber-300 transition"
                >
                  {t('campus.editPollBtn', '✏️ Edit Poll')}
                </button>
              )}

              {isAdmin && campusTab === 'riddle' && (
                <button
                  onClick={handleOpenEditRiddle}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-stone-900 text-xs font-black rounded-xl border border-amber-300 transition"
                >
                  {t('campus.editRiddleBtn', '✏️ Edit Riddle')}
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setCampusTab('poll')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                    campusTab === 'poll'
                      ? 'bg-stone-900 text-amber-400 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t('campus.pollTab', '🗳️ Match Poll')}
                </button>
                <button
                  onClick={() => setCampusTab('riddle')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                    campusTab === 'riddle'
                      ? 'bg-stone-900 text-amber-400 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t('campus.riddleTab', '🧠 Daily Riddle')}
                </button>
              </div>
            </div>
          </div>

          {loadingCampus ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-200 border-b-amber-500"></div>
            </div>
          ) : (
            <>
              {/* TAB 1: POLL */}
              {campusTab === 'poll' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {poll?.badge || 'Campus Poll'}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      {totalPollVotes} {t('campus.studentsVoted', 'Students Voted')}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-stone-900">
                    {poll?.question || 'No active question.'}
                  </h3>

                  <div className="space-y-2 pt-1">
                    {poll?.options?.map((opt) => {
                      const percentage =
                        totalPollVotes > 0 ? Math.round(((opt.votes || 0) / totalPollVotes) * 100) : 0;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVotePoll(opt.id)}
                          disabled={hasUserVoted}
                          className={`w-full text-left p-3 rounded-2xl border transition relative overflow-hidden flex flex-col justify-center ${
                            hasUserVoted
                              ? 'border-amber-300 bg-amber-50/40'
                              : 'border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50 active:scale-[0.99]'
                          }`}
                        >
                          {hasUserVoted && (
                            <div
                              className="absolute top-0 left-0 bottom-0 bg-amber-300/30 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900">{opt.label}</span>
                            {hasUserVoted && (
                              <span className="text-xs font-black text-stone-800">
                                {percentage}%{' '}
                                <span className="text-[10px] text-stone-500">({opt.votes || 0})</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {hasUserVoted ? (
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <span>✓</span> {t('campus.voted', 'You have cast your vote in this poll!')}
                    </p>
                  ) : (
                    <p className="text-[11px] text-stone-500 font-medium italic">
                      {t('campus.votePrompt', '💡 Click any option above to cast your student vote!')}
                    </p>
                  )}
                </div>
              )}

              {/* TAB 2: DAILY RIDDLE */}
              {campusTab === 'riddle' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {riddle?.subtext || 'Daily Logic Challenge'}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      {language === 'bn' ? 'মাধ্যমিক বুস্টার' : 'Madhyamik Boost'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                    <h3 className="text-xs font-black text-stone-900 leading-snug">
                      🧩 {language === 'bn' ? 'প্রশ্ন:' : 'Question:'} {riddle?.question}
                    </h3>
                  </div>

                  {showTeaserAnswer ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 animate-fade-in">
                      <p className="text-xs font-black text-emerald-900">
                        {t('campus.solutionHeader', '💡 Solution & Explanation:')}
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                        {riddle?.answer}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTeaserAnswer(true)}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-black rounded-xl transition"
                    >
                      {t('campus.revealSolution', 'Reveal Solution & Explanation 💡')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: WALL OF FAME */}
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-150 pb-3 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🏆</span>
                <h2 className="text-sm font-black text-stone-900">
                  {t('campus.wallHeading', 'JHS Wall of Fame')}
                </h2>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase">
                  Spotlight
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={handleOpenCreateSpotlight}
                  className="text-xs font-black text-stone-700 hover:text-stone-950 px-2.5 py-1 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                >
                  {t('campus.addStarStudent', '➕ Add Star')}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {spotlights.map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-start justify-between gap-2 hover:border-amber-400 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl shrink-0">{item.icon || '⭐'}</span>
                    <div>
                      <p className="text-xs font-black text-stone-900">{item.name}</p>
                      <p className="text-[11px] text-amber-800 font-bold">{item.title}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditSpotlight(item)}
                        className="p-1 hover:bg-stone-200 rounded text-xs"
                        title="Edit Spotlight"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSpotlight(item._id, item.name)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded text-xs"
                        title="Delete Spotlight"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-150 text-center">
            <p className="text-[10px] text-stone-400 font-medium">
              Celebrated achievements of Jankapur High School scholars.
            </p>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: NOTICE MODAL (CREATE / EDIT) --- */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2">
              <h3 className="text-base font-black text-stone-900">
                {editingNotice ? t('noticeModal.editTitle', '✏️ Edit School Notice') : t('noticeModal.createTitle', '📢 Post New School Notice')}
              </h3>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-stone-400 hover:text-stone-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('noticeModal.titleLabel', 'Notice Title')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Admit Card & Form Verification"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                    {t('noticeModal.badgeLabel', 'Badge / Tag')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MADHYAMIK 2025"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                    value={noticeForm.badge}
                    onChange={(e) => setNoticeForm({ ...noticeForm, badge: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                    {t('noticeModal.dateLabel', 'Date / Time Text')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Today, Friday 3:30 PM"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                    value={noticeForm.dateText}
                    onChange={(e) => setNoticeForm({ ...noticeForm, dateText: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('noticeModal.contentLabel', 'Detailed Notice Content')} *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Full instructions for students..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 resize-none"
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2.5 text-stone-600 hover:text-stone-900 text-xs font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-black rounded-xl text-xs shadow"
                >
                  {editingNotice ? t('common.save', 'Save Changes') : t('noticeModal.publishBtn', 'Publish Notice 📢')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: POLL EDIT MODAL (ADMIN ONLY) --- */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2">
              <h3 className="text-base font-black text-stone-900">
                {t('pollModal.title', '✏️ Edit Match Poll (Don Admin)')}
              </h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="text-stone-400 hover:text-stone-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePoll} className="space-y-3 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('pollModal.questionLabel', 'Poll Question')} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  value={pollForm.question}
                  onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('pollModal.badgeLabel', 'Badge Text')} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  value={pollForm.badge}
                  onChange={(e) => setPollForm({ ...pollForm, badge: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-stone-600">
                  {language === 'bn' ? 'বিকল্পসমূহ (৪টি অপশন)' : 'Options & Choices (4 Total)'}
                </label>
                {pollForm.options.map((opt, idx) => (
                  <input
                    key={opt.id || idx}
                    type="text"
                    required
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                    value={opt.label}
                    onChange={(e) => {
                      const updated = [...pollForm.options];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setPollForm({ ...pollForm, options: updated });
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="resetVotes"
                  checked={pollForm.resetVotes}
                  onChange={(e) => setPollForm({ ...pollForm, resetVotes: e.target.checked })}
                  className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="resetVotes" className="text-xs text-stone-600 font-bold cursor-pointer">
                  {t('pollModal.resetLabel', 'Reset all student votes to zero for a fresh poll')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-black rounded-xl text-xs shadow"
                >
                  {t('common.save', 'Save Poll 🚀')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: RIDDLE EDIT MODAL (ADMIN ONLY) --- */}
      {showRiddleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2">
              <h3 className="text-base font-black text-stone-900">
                {t('riddleModal.title', '✏️ Edit Daily Riddle (Don Admin)')}
              </h3>
              <button
                onClick={() => setShowRiddleModal(false)}
                className="text-stone-400 hover:text-stone-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRiddle} className="space-y-3 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('riddleModal.questionLabel', 'Riddle Question')} *
                </label>
                <textarea
                  rows="2"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 resize-none"
                  value={riddleForm.question}
                  onChange={(e) => setRiddleForm({ ...riddleForm, question: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('riddleModal.subtextLabel', 'Tag / Subtext')} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  value={riddleForm.subtext}
                  onChange={(e) => setRiddleForm({ ...riddleForm, subtext: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('riddleModal.answerLabel', 'Explanation & Solution Answer')} *
                </label>
                <textarea
                  rows="3"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 resize-none"
                  value={riddleForm.answer}
                  onChange={(e) => setRiddleForm({ ...riddleForm, answer: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setShowRiddleModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-black rounded-xl text-xs shadow"
                >
                  {t('common.save', 'Save Riddle 💡')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: SPOTLIGHT MODAL (CREATE / EDIT) --- */}
      {showSpotlightModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2">
              <h3 className="text-base font-black text-stone-900">
                {editingSpotlight ? t('spotlightModal.editTitle', '✏️ Edit Star Student Entry') : t('spotlightModal.createTitle', '🏆 Honor a Star Student')}
              </h3>
              <button
                onClick={() => setShowSpotlightModal(false)}
                className="text-stone-400 hover:text-stone-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpotlight} className="space-y-3 text-xs font-bold text-stone-700">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                    {language === 'bn' ? 'আইকন' : 'Emoji / Icon'}
                  </label>
                  <select
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-base text-center"
                    value={spotlightForm.icon}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, icon: e.target.value })}
                  >
                    <option value="⚽">⚽ {language === 'bn' ? 'খেলাধুলো' : 'Sports'}</option>
                    <option value="🥇">🥇 {language === 'bn' ? 'স্বর্ণপদক' : 'Gold Medal'}</option>
                    <option value="🎨">🎨 {language === 'bn' ? 'শিল্প ও সংস্কৃতি' : 'Art & Culture'}</option>
                    <option value="🔬">🔬 {language === 'bn' ? 'বিজ্ঞান' : 'Science'}</option>
                    <option value="⭐">⭐ {language === 'bn' ? 'স্টার' : 'Star'}</option>
                    <option value="📚">📚 {language === 'bn' ? 'পড়াশোনা' : 'Books'}</option>
                    <option value="🏏">🏏 {language === 'bn' ? 'ক্রিকেট' : 'Cricket'}</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                    {t('spotlightModal.nameLabel', 'Student Name & Class')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Mondal (Class 10A)"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                    value={spotlightForm.name}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('spotlightModal.titleLabel', 'Achievement Title')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Football Star of the Week"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  value={spotlightForm.title}
                  onChange={(e) => setSpotlightForm({ ...spotlightForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  {t('spotlightModal.descLabel', 'Description & Story')} *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Scored hat-trick in the inter-school tournament."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 resize-none"
                  value={spotlightForm.description}
                  onChange={(e) => setSpotlightForm({ ...spotlightForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setShowSpotlightModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-black rounded-xl text-xs shadow"
                >
                  {editingSpotlight ? t('common.save', 'Save Changes') : t('common.save', 'Add to Wall of Fame 🏆')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampusUpdates;
