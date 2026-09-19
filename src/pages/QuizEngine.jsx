import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchQuizzesApi, submitQuizApi } from '../services/api';

function QuizEngine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // Stores selections: { questionId: 'A' }
  const [reportCard, setReportCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Fetch the target exam paper from our backend
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetchQuizzesApi();
        if (response.data.success) {
          const activeQuiz = response.data.data.find(q => q._id === id);
          setQuiz(activeQuiz);
          if (activeQuiz?.duration) {
            setTimeLeft(activeQuiz.duration * 60); // Convert minutes to total seconds for the countdown
          }
        }
      } catch (err) {
        alert('Failed to load exam script definitions.');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, token]);

  // 2. The Asynchronous Countdown Timer Clock Hook
  useEffect(() => {
    if (timeLeft <= 0 || reportCard) {
      if (timeLeft === 0 && quiz && !reportCard) handleExamSubmission(); // Auto-submit when time hits zero!
      return;
    }
    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timeLeft, reportCard]);

  const handleOptionSelect = (questionId, optionLetter) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionLetter });
  };

  // 3. Post the answer sheet payload back to our automated backend grading engine
  const handleExamSubmission = async () => {
    try {
      const answersPayload = Object.keys(selectedAnswers).map(qId => ({
        questionId: qId,
        selectedOption: selectedAnswers[qId]
      }));

      const response = await submitQuizApi(id, answersPayload);

      if (response.data.success) {
        setReportCard(response.data);
      }
    } catch (err) {
      alert('Error evaluating answer sheet: ' + err.message);
    }
  };

  // Format seconds into digital clock view (MM:SS)
  const formatClockTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-indigo-600"></div>
    </div>
  );
  if (!quiz) return <div className="text-center p-8 font-bold text-slate-700">Exam paper profile resolution missing.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* EXAM CONSOLE SCREEN HEADER CONTROL ROW */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between sticky top-[60px] md:top-4 z-10">
        <div>
          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {quiz.subject}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 mt-1">{quiz.title}</h2>
        </div>
        {!reportCard && (
          <div className={`px-4 py-2 rounded-2xl text-center font-mono font-black text-base sm:text-lg shadow-inner border ${timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-stone-900 text-amber-400 border-stone-800'}`}>
            ⏱️ {formatClockTime()}
          </div>
        )}
      </div>

      {/* 📊 RENDER REPORT CARD MARK SHEET SCREEN */}
      {reportCard ? (
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="text-center bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-6 sm:p-8 rounded-3xl text-white border border-stone-800 shadow-xl">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Examination Result
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-2 text-white">Official Mark Sheet 📊</h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5 text-center">
              <div className="bg-stone-800/90 border border-stone-700 p-3.5 rounded-2xl">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Total Marks</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{reportCard.resultSummary.totalMarks}</p>
              </div>
              <div className="bg-stone-800/90 border border-stone-700 p-3.5 rounded-2xl">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Marks Scored</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{reportCard.resultSummary.marksObtained}</p>
              </div>
              <div className="bg-stone-800/90 border border-stone-700 p-3.5 rounded-2xl">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Percentage</p>
                <p className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">{reportCard.resultSummary.percentage}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-2">Question Analysis Breakdown</h4>
            {reportCard.detailedBreakdown.map((item, index) => (
              <div key={index} className={`p-4 rounded-2xl border text-sm ${item.result === 'Correct' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                <p className="font-bold text-stone-900">Q{index + 1}: {item.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs font-semibold">
                  <p className="text-stone-600">Your Answer: <span className={item.result === 'Correct' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{item.studentSelection}</span></p>
                  <p className="text-stone-600">Master Key: <span className="text-emerald-700 font-bold">{item.correctAnswer}</span></p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/quizzes')}
            className="w-full bg-stone-900 hover:bg-stone-800 text-amber-400 font-black py-3.5 rounded-2xl text-center shadow-lg transition transform active:scale-95 text-xs border border-stone-700"
          >
            Return to Examination Hall 📝
          </button>
        </div>
      ) : (
        /* 📝 RENDER QUESTIONS ANSWER SHEET LIST SCREEN */
        <div className="space-y-4">
          {quiz.questions.map((question, qIdx) => (
            <div key={question._id} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-6 space-y-4">
              <p className="font-black text-stone-900 text-base">Question {qIdx + 1}: <span className="font-semibold text-stone-700">{question.questionText}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = selectedAnswers[question._id] === letter;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(question._id, letter)}
                      className={`w-full text-left p-3.5 rounded-2xl border text-sm font-medium transition duration-100 transform active:scale-[0.99] flex items-center space-x-3 ${
                        isSelected 
                          ? 'bg-stone-900 border-stone-900 text-white shadow-md font-bold' 
                          : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100 hover:border-amber-300'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center border text-xs font-black shrink-0 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-500' 
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}>
                        {letter}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={handleExamSubmission}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-4 rounded-3xl text-center shadow-xl shadow-amber-500/25 tracking-wide transform active:scale-95 duration-100 text-sm"
          >
            Submit Final Answer Sheet 📤
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizEngine;
