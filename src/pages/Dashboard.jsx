import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // 👈 1. Import socket client driver hooks
import { AuthContext } from '../context/AuthContext';

function Dashboard() {
  const { token, user } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  const fetchTimelineFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err) {
      setError('Could not refresh the campus feed timeline.');
    } finally {
      setLoading(false);
    }
  };

  // 💡 2. REAL-TIME SOCKET HANDSHAKE HOOK ENGINE
  useEffect(() => {
    if (!token) return;

    // Connect directly over the air to our running backend socket pipeline port
    const socket = io('http://localhost:5000');

    // Fetch original timeline listings on load
    fetchTimelineFeed();

    // ⚡ Listen for 'doubt_updated' broadcast events triggered by other students typing elsewhere
    socket.on('doubt_updated', (updatedPost) => {
      // Map through current on-screen posts, swap the single matching post card with its fresh cloud data state instantly!
      setPosts(prevPosts => 
        prevPosts.map(post => post._id === updatedPost._id ? updatedPost : post)
      );
    });

    // Clean up radio connection channels when user closes their dashboard page layout screen nodes
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/api/posts', { content: newPostContent }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        setNewPostContent('');
        fetchTimelineFeed(); 
      }
    } catch (err) {
      alert('Failed to publish your post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      // Post answer directly. The backend controller handles sending out the live broadcast signals!
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        setCommentInputs({ ...commentInputs, [postId]: '' });
      }
    } catch (err) {
      alert('Failed to submit your answer.');
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-sm text-white">
        <h1 className="text-xl sm:text-2xl font-black">Namaskar, {user?.name}! 👋</h1>
        <p className="text-indigo-100 text-xs mt-1 font-medium">
          Connected to <span className="font-extrabold underline">{user?.schoolName}</span>.
        </p>
      </div>

      {/* CREATE POST WINDOW PANEL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handlePostSubmit} className="space-y-3">
          <label className="block text-xs font-black text-indigo-700 uppercase tracking-wider">
            📢 Post an Update or Ask a Homework Doubt
          </label>
          <textarea
            rows="3"
            required
            placeholder="Hey classmates! Ask a question here..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-gray-700 resize-none"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || !newPostContent.trim()} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow select-none">
              Share on Wall 🚀
            </button>
          </div>
        </form>
      </div>

      {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

      {/* TIMELINE FEED CARDS */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Latest Campus Happenings</h2>
        
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white text-center py-12 rounded-2xl border text-gray-400 text-sm font-medium">
                The community wall is completely quiet right now.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  
                  <div className="flex items-center space-x-3">
                    <img src={post.user?.profilePicture || 'https://cloudinary.com'} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                    <div>
                      <h4 className="text-sm font-black text-gray-800 leading-tight">{post.user?.name}</h4>
                      <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">{post.user?.classOrBatch} • {post.user?.schoolName}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  <div className="text-[10px] text-gray-400 font-bold">🕒 {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>

                  {/* ANSWERS CONTAINER SUB-LAYERS */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Answers Given ({post.comments?.length || 0})</h5>
                    
                    {post.comments && post.comments.map((comment, cIdx) => (
                      <div key={cIdx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-gray-800">{comment.user?.name || 'Classmate'}</span>
                          <span className="bg-indigo-50 text-indigo-600 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase">{comment.user?.role || 'student'}</span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{comment.text}</p>
                      </div>
                    ))}

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a solution or answer here..."
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => handleCommentChange(post._id, e.target.value)}
                      />
                      <button onClick={() => handleCommentSubmit(post._id)} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
                        Submit
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
