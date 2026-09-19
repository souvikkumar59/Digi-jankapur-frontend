import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Automatically fetch quizzes matching the student's logged-in school credentials
        const response = await axios.get(`https://smart-jankapur-backend.onrender.com//api/quizzes?schoolTag=${user.schoolName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setQuizzes(response.data.data);
        }
      } catch (err) {
        setError('Failed to fetch available mock exams.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Mock Exams 📝</h1>
        <p className="text-gray-500 text-sm">Attempt timed tests curated by local school teachers to test your knowledge.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quizzes.length === 0 ? (
            <div className="col-span-full bg-white text-center py-12 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-500">
              No active mock exams are scheduled for {user?.schoolName} right now.
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition duration-150">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {quiz.subject}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">⏰ {quiz.duration} Mins</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{quiz.title}</h3>
                  <p className="text-xs text-gray-500">Target: <span className="font-semibold text-gray-700">{quiz.classLevel}</span></p>
                  <p className="text-xs text-gray-400 mt-2">Prepared by: {quiz.createdBy?.name || 'School Teacher'}</p>
                </div>

                <button
                  onClick={() => navigate(`/quiz/${quiz._id}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center py-2.5 rounded-xl shadow text-sm mt-5 transition transform active:scale-95"
                >
                  Start Examination 🚀
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default QuizList;
