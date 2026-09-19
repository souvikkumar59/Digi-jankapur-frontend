import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchQuizzesApi, createQuizApi, deleteQuizApi } from '../services/api';

function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'school'

  // EXAM CREATOR (FACULTY / ADMIN) STATE
  const [showCreator, setShowCreator] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const initialQuizForm = {
    title: '',
    subject: 'Physical Science',
    schoolTag: 'All Schools',
    classLevel: 'Class 10',
    duration: 15,
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 'A',
      },
    ],
  };

  const [newQuiz, setNewQuiz] = useState(initialQuizForm);
  
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const canManageQuizzes = user?.role === 'admin' || user?.role === 'teacher';

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeTab === 'school' && user?.schoolName) {
        params.schoolTag = user.schoolName;
      }
      // If 'all', no restrictive schoolTag is sent so EVERY student sees all available exams!
      const response = await fetchQuizzesApi(params);
      if (response.data.success) {
        setQuizzes(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch available mock exams. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuizzes();
    }
  }, [token, activeTab]);

  // DYNAMIC QUESTION HANDLERS
  const handleAddQuestion = () => {
    setNewQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOption: 'A',
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (newQuiz.questions.length <= 1) return;
    setNewQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionTextChange = (index, val) => {
    setNewQuiz((prev) => {
      const copy = [...prev.questions];
      copy[index] = { ...copy[index], questionText: val };
      return { ...prev, questions: copy };
    });
  };

  const handleOptionChange = (qIndex, optIndex, val) => {
    setNewQuiz((prev) => {
      const copy = [...prev.questions];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = val;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return { ...prev, questions: copy };
    });
  };

  const handleCorrectOptionChange = (qIndex, correct) => {
    setNewQuiz((prev) => {
      const copy = [...prev.questions];
      copy[qIndex] = { ...copy[qIndex], correctOption: correct };
      return { ...prev, questions: copy };
    });
  };

  // SUBMIT NEW MOCK EXAM
  const handleCreateQuizSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!newQuiz.title.trim()) {
      setCreateError('Please provide an Examination Title.');
      return;
    }
    if (!newQuiz.subject.trim()) {
      setCreateError('Please specify the Subject.');
      return;
    }
    if (!newQuiz.duration || Number(newQuiz.duration) < 1) {
      setCreateError('Please specify a duration of at least 1 minute.');
      return;
    }

    // Validate each question has text and all 4 options populated
    for (let i = 0; i < newQuiz.questions.length; i++) {
      const q = newQuiz.questions[i];
      if (!q.questionText.trim()) {
        setCreateError(`Question #${i + 1} statement cannot be empty.`);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o] || !q.options[o].trim()) {
          setCreateError(`Question #${i + 1}: Option ${['A', 'B', 'C', 'D'][o]} cannot be empty.`);
          return;
        }
      }
    }

    setCreating(true);
    try {
      const payload = {
        ...newQuiz,
        duration: Number(newQuiz.duration),
      };
      const response = await createQuizApi(payload);
      if (response.data.success) {
        setCreateSuccess(`🎉 "${newQuiz.title}" published successfully to the Examination Hall!`);
        setNewQuiz(initialQuizForm);
        setShowCreator(false);
        fetchQuizzes();
        setTimeout(() => setCreateSuccess(''), 6000);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to publish mock exam.');
    } finally {
      setCreating(false);
    }
  };

  // DELETE MOCK EXAM
  const handleDeleteQuiz = async (quizId, title) => {
    const isConfirmed = window.confirm(
      `⚠️ ADMIN / FACULTY CONFIRMATION:\n\nAre you sure you want to permanently delete "${title || 'this mock exam'}"?\n\nStudents will no longer be able to take this test.`
    );
    if (!isConfirmed) return;

    setDeleteLoadingId(quizId);
    try {
      const res = await deleteQuizApi(quizId);
      if (res.data.success) {
        setCreateSuccess(`Mock exam "${title || ''}" was permanently removed.`);
        setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
        setTimeout(() => setCreateSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete mock exam.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 🌟 HERO BANNER: WARM MOCHA & RADIANT GOLD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-6 sm:p-8 text-white shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Open To All Scholars
              </span>
              <span className="text-xs text-stone-400 font-bold">• Real-Time Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mock Examination Hall 📝
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl font-medium leading-relaxed">
              Standardized multiple-choice examinations curated by faculty members. Every student in Jankapur Hub can test their knowledge and benchmark progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManageQuizzes && (
              <button
                onClick={() => setShowCreator(!showCreator)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/25 transition duration-150 transform active:scale-95 flex items-center gap-2"
              >
                <span>{showCreator ? '✕ Close Exam Studio' : '✍️ Deploy New Mock Exam'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-stone-800/80 px-4 py-2.5 rounded-2xl border border-stone-700/80">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-[10px] text-amber-300 font-black uppercase tracking-wider">Active Papers</p>
                <p className="text-lg font-black text-white">{quizzes.length} Tests Live</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-800 pt-5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700'
            }`}
          >
            🌐 All Mock Tests ({activeTab === 'all' ? quizzes.length : 'All'})
          </button>
          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'school'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700'
            }`}
          >
            🏫 My School: {user?.schoolName || 'Enrolled School'}
          </button>
        </div>
      </div>

      {/* SUCCESS / DEPLOY NOTIFICATION */}
      {createSuccess && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs font-black flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <span>{createSuccess}</span>
          </div>
          <button
            onClick={() => setCreateSuccess('')}
            className="text-emerald-700 hover:text-emerald-950 font-black px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* QUIZ BUILDER / UPLOAD DESK (FACULTY & ADMIN ONLY) */}
      {showCreator && (
        <div className="bg-white rounded-3xl border-2 border-amber-400/80 shadow-2xl p-6 sm:p-7 space-y-6 animate-fade-in">
          {/* Studio Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-150 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <h2 className="text-lg font-black text-stone-900 tracking-tight">
                  Faculty Examination Studio & Quiz Builder
                </h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Admin / Faculty
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Deploy timed multiple-choice papers for students. All questions are auto-evaluated instantly upon submission.
              </p>
            </div>

            <button
              onClick={() => setShowCreator(false)}
              className="self-start sm:self-auto text-xs font-bold text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
            >
              ✕ Close
            </button>
          </div>

          {createError && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateQuizSubmit} className="space-y-6">
            {/* EXAM METADATA ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-bold text-stone-700">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025 Madhyamik Physical Science Mock Test"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical Science"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900"
                  value={newQuiz.subject}
                  onChange={(e) => setNewQuiz({ ...newQuiz, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Target Class *
                </label>
                <select
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none text-stone-800 focus:ring-2 focus:ring-amber-500"
                  value={newQuiz.classLevel}
                  onChange={(e) => setNewQuiz({ ...newQuiz, classLevel: e.target.value })}
                >
                  <option value="Class 10">Class 10 (Madhyamik)</option>
                  <option value="Class 12">Class 12 (Higher Secondary)</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 11">Class 11</option>
                  <option value="General">All Classes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  required
                  placeholder="Minutes"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900"
                  value={newQuiz.duration}
                  onChange={(e) => setNewQuiz({ ...newQuiz, duration: e.target.value })}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  School Tag (Access Scope) *
                </label>
                <select
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none text-stone-800 focus:ring-2 focus:ring-amber-500 font-bold"
                  value={newQuiz.schoolTag}
                  onChange={(e) => setNewQuiz({ ...newQuiz, schoolTag: e.target.value })}
                >
                  <option value="All Schools">🌐 All Schools (Open to Pooja, Souvik & Every Student)</option>
                  <option value="Jankapur High School">🏫 Jankapur High School</option>
                  <option value="Jankapur Primary School">🏫 Jankapur Primary School</option>
                  <option value="Bodhi Bikash">🏫 Bodhi Bikash</option>
                  <option value="Jankapur High Madrasha">🏫 Jankapur High Madrasha</option>
                </select>
              </div>
            </div>

            {/* QUESTIONS SECTION */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    Exam Questions ({newQuiz.questions.length} Total)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Write each question statement, specify 4 choices, and select the correct answer key.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-black rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <span>➕ Add Next Question</span>
                </button>
              </div>

              {/* LIST OF QUESTION CARDS */}
              <div className="space-y-4">
                {newQuiz.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3 relative transition hover:border-amber-400"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 text-amber-400 text-xs font-black flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                          Question #{qIndex + 1}
                        </span>
                      </div>

                      {newQuiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-stone-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 p-1 rounded-md hover:bg-red-50 transition"
                          title="Remove Question"
                        >
                          <span>🗑️</span>
                          <span className="text-[10px] uppercase font-black">Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Question Statement */}
                    <div>
                      <textarea
                        rows="2"
                        required
                        placeholder={`Type question #${qIndex + 1} statement here...`}
                        className="w-full p-3 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold text-stone-900 placeholder:text-stone-400 resize-none"
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      />
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {['A', 'B', 'C', 'D'].map((optLetter, optIdx) => (
                        <div
                          key={optLetter}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                            q.correctOption === optLetter
                              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            q.correctOption === optLetter
                              ? 'bg-amber-400 text-stone-950 shadow-sm'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {optLetter}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`Option ${optLetter} text`}
                            className="w-full bg-transparent outline-none text-xs font-bold text-stone-900 placeholder:text-stone-400"
                            value={q.options[optIdx]}
                            onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Correct Answer Key Selector */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-black text-stone-600 uppercase tracking-wider">
                        Correct Answer Key:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {['A', 'B', 'C', 'D'].map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleCorrectOptionChange(qIndex, key)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                              q.correctOption === key
                                ? 'bg-amber-400 text-stone-950 shadow-sm ring-1 ring-amber-500'
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            Option {key} {q.correctOption === key ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 rounded-2xl text-xs font-black text-stone-700 hover:text-stone-900 transition flex items-center justify-center gap-2"
              >
                <span>➕ Add Another Question to Test Paper</span>
              </button>
            </div>

            {/* FORM ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto px-7 py-3 bg-stone-900 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-white text-xs font-black rounded-xl shadow-lg transition duration-150 transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                    <span>Publishing Exam...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Publish Mock Exam to Campus</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-200 border-b-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quizzes.length === 0 ? (
            <div className="col-span-full bg-white text-center py-14 rounded-3xl border border-dashed border-stone-300 p-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="font-black text-stone-900 text-base">No active mock exams in this view right now.</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                {activeTab === 'school'
                  ? `No exams specifically tagged for ${user?.schoolName}. Switch to "All Mock Tests" to see all campus examinations.`
                  : 'Check back soon! Faculty members schedule new mock papers regularly.'}
              </p>
              {activeTab === 'school' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="mt-4 px-4 py-2 bg-stone-900 text-amber-400 text-xs font-black rounded-xl hover:bg-stone-800 transition"
                >
                  View All Mock Tests Instead 🌐
                </button>
              )}
            </div>
          ) : (
            quizzes.map((quiz) => {
              const isCreator = quiz.createdBy && (
                quiz.createdBy === user?.id ||
                quiz.createdBy === user?._id ||
                quiz.createdBy?._id === user?.id ||
                quiz.createdBy?._id === user?._id
              );
              const canDeleteQuiz = user?.role === 'admin' || isCreator;

              return (
                <div
                  key={quiz._id}
                  className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 flex flex-col justify-between hover:shadow-xl hover:border-amber-400 transition duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                        {quiz.subject}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-700 font-black bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          ⏰ {quiz.duration} Mins
                        </span>

                        {canDeleteQuiz && (
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                            disabled={deleteLoadingId === quiz._id}
                            title="Delete Mock Exam"
                            className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-200 text-xs"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-stone-900 mb-1.5 leading-snug">
                      {quiz.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
                      <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md font-bold text-stone-700">
                        🎯 {quiz.classLevel || 'Class 10'}
                      </span>
                      <span className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md font-bold text-stone-600">
                        🏫 {quiz.schoolTag || 'All Schools'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mt-2 font-medium">
                      Curated by: <span className="font-bold text-stone-700">{quiz.createdBy?.name || 'Academic Faculty'}</span>
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={() => navigate(`/quiz/${quiz._id}`)}
                      className="w-full bg-stone-900 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-white font-black text-center py-3 rounded-xl shadow-md text-xs transition duration-150 transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Enter Examination</span>
                      <span>🚀</span>
                    </button>

                    {canDeleteQuiz && (
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                        disabled={deleteLoadingId === quiz._id}
                        className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 hover:border-red-300 font-bold text-center py-2 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <span>🗑️</span>
                        <span>{deleteLoadingId === quiz._id ? 'Deleting...' : 'Delete Exam (Admin / Faculty)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default QuizList;
