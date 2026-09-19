import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const quizPlaceholder = "quizPlaceholder";

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
        const response = await axios.get(`https://smart-jankapur-backend.onrender.com//api/quizzes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const activeQuiz = response.data.data.find(q => q._id === id);
          setQuiz(activeQuiz);
          setTimeLeft(activeQuiz.duration * 60); // Convert minutes to total seconds for the countdown
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

      const response = await axios.post(
        `https://smart-jankapur-backend.onrender.com//api/quizzes/${id}/submit`,
        { answers: answersPayload },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

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

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  if (!quiz) return <div className="text-center p-8 font-bold">Exam paper profile resolution missing.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* EXAM CONSOLE SCREEN HEADER CONTROL ROW */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between sticky top-[60px] md:top-0 z-10">
        <div>
          <h2 className="text-xl font-black text-gray-900">{quiz.title}</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{quiz.subject}</p>
        </div>
        {!reportCard && (
          <div className={`px-4 py-2 rounded-xl text-center font-mono font-bold text-lg shadow-inner ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-700'}`}>
            ⏱️ {formatClockTime()}
          </div>
        )}
      </div>

      {/* 📊 RENDER REPORT CARD MARK SHEET SCREEN (Visible ONLY after hitting submit button) */}
      {reportCard ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6 animate-fade-in">
          <div className="text-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-2xl font-black text-indigo-900">Exam Report Card 📊</h3>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="bg-white p-3 rounded-xl shadow-sm"><p className="text-xs text-gray-400 font-bold uppercase">Total Marks</p><p className="text-xl font-black text-gray-800">{reportCard.resultSummary.totalMarks}</p></div>
              <div className="bg-white p-3 rounded-xl shadow-sm"><p className="text-xs text-gray-400 font-bold uppercase">Marks Obtained</p><p className="text-xl font-black text-green-600">{reportCard.resultSummary.marksObtained}</p></div>
              <div className="bg-white p-3 rounded-xl shadow-sm"><p className="text-xs text-gray-400 font-bold uppercase">Percentage</p><p className="text-xl font-black text-indigo-600">{reportCard.resultSummary.percentage}</p></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-bold text-gray-800 border-b pb-2">Question Analysis Breakdown</h4>
            {reportCard.detailedBreakdown.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl border text-sm ${item.result === 'Correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-bold text-gray-800">Q{index + 1}: {item.question}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-semibold">
                  <p className="text-gray-500">Your Selection: <span className={item.result === 'Correct' ? 'text-green-700' : 'text-red-700'}>{item.studentSelection}</span></p>
                  <p className="text-gray-600">Correct Master Key Option: <span className="text-green-700 font-bold">{item.correctAnswer}</span></p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/quizzes')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center shadow-lg transition"
          >
            Return to Exam Roster
          </button>
        </div>
      ) : (
        /* 📝 RENDER QUESTIONS ANSWER SHEET LIST SCREEN - Visible when active test session is running */
        <div className="space-y-4">
          {quiz.questions.map((question, qIdx) => (
            <div key={question._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <p className="font-bold text-gray-800 text-base">Question {qIdx + 1}: <span className="font-semibold">{question.questionText}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx); // Map array index 0,1,2,3 dynamically to character tags A,B,C,D
                  const isSelected = selectedAnswers[question._id] === letter;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(question._id, letter)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition duration-100 transform active:scale-[0.99] flex items-center space-x-3 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-bold' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold ${isSelected ? 'bg-indigo-700 border-indigo-700 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>{letter}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={handleExamSubmission}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black py-4 rounded-2xl text-center shadow-xl tracking-wide transform active:scale-95 duration-100 text-base"
          >
            Submit Final Answer Sheet 📤
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizEngine;
