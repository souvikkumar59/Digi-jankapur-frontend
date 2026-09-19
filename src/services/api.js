import axios from 'axios';
import { io } from 'socket.io-client';

// Intelligent backend base URL:
// When running locally on localhost, connect directly to the local backend on port 5000.
// In production, use VITE_BACKEND_URL or fallback to Render.
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envUrl = import.meta.env.VITE_BACKEND_URL;

// Guarantee connection to the live service (evn3) even if Vercel still has the old decommissioned service URL configured
const isOldBackend = envUrl && envUrl.toLowerCase().includes('smart-jankapur-backend.onrender.com') && !envUrl.toLowerCase().includes('smart-jankapur-backend-evn3');

const activeProdUrl = (!envUrl || isOldBackend)
  ? 'https://smart-jankapur-backend-evn3.onrender.com'
  : envUrl;

const rawUrl = isLocalhost
  ? (envUrl && envUrl.includes('localhost') ? envUrl : 'http://localhost:5000')
  : activeProdUrl;

export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic token injection interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Socket.io client
export const createSocket = () => {
  return io(API_BASE_URL, {
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
};


// ==========================================
// API HELPER FUNCTIONS
// ==========================================

// --- Auth APIs ---
export const loginApi = (credentials) => api.post('/api/auth/login', credentials);
export const registerApi = (userData) => api.post('/api/auth/register', userData);
export const resetPasswordApi = (resetData) => api.post('/api/auth/reset-password', resetData);

// --- Post & Community APIs ---
export const fetchPostsApi = (params) => api.get('/api/posts', { params });
export const createPostApi = (postData) => api.post('/api/posts', postData);
export const commentOnPostApi = (postId, text) => api.post(`/api/posts/${postId}/comment`, { text });
export const toggleLikePostApi = (postId) => api.post(`/api/posts/${postId}/like`);

// --- User & Directory APIs ---
export const fetchDirectoryApi = (params) => api.get('/api/users/directory', { params });
export const fetchUserProfileApi = (userId) => api.get(`/api/users/${userId}`);
export const recordProfileViewApi = (userId) => api.post(`/api/users/view/${userId}`);
export const updateUserProfileApi = (profileData) => api.put('/api/users/profile', profileData);
export const fetchProfileAnalyticsApi = () => api.get('/api/users/profile/analytics');

// --- Document / Learning Vault APIs ---
export const fetchDocumentsApi = (params) => api.get('/api/documents', { params });
export const uploadDocumentApi = (docData) => api.post('/api/documents', docData);
export const deleteDocumentApi = (id) => api.delete(`/api/documents/${id}`);

// --- Quiz / Mock Exam APIs ---
export const fetchQuizzesApi = (params) => api.get('/api/quizzes', { params });
export const createQuizApi = (quizData) => api.post('/api/quizzes', quizData);
export const submitQuizApi = (quizId, answers) => api.post(`/api/quizzes/${quizId}/submit`, { answers });
export const deleteQuizApi = (quizId) => api.delete(`/api/quizzes/${quizId}`);

// --- Payment APIs ---
export const createPaymentCheckoutApi = (payload) => api.post('/api/payments/checkout', payload);
export const verifyPaymentApi = (payload) => api.post('/api/payments/verify', payload);

// --- Official School Notice APIs ---
export const fetchNoticesApi = (params) => api.get('/api/notices', { params });
export const createNoticeApi = (data) => api.post('/api/notices', data);
export const updateNoticeApi = (id, data) => api.put(`/api/notices/${id}`, data);
export const deleteNoticeApi = (id) => api.delete(`/api/notices/${id}`);

// --- Campus Life & Widget APIs (Poll, Riddle, Wall of Fame) ---
export const fetchCampusDataApi = () => api.get('/api/campus');
export const updatePollApi = (data) => api.put('/api/campus/poll', data);
export const votePollApi = (optionId) => api.post('/api/campus/poll/vote', { optionId });
export const updateRiddleApi = (data) => api.put('/api/campus/riddle', data);
export const createSpotlightApi = (data) => api.post('/api/campus/spotlight', data);
export const updateSpotlightApi = (id, data) => api.put(`/api/campus/spotlight/${id}`, data);
export const deleteSpotlightApi = (id) => api.delete(`/api/campus/spotlight/${id}`);

export default api;


