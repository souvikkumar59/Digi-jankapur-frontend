import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Classmate Directory', path: '/directory', icon: '👥' },
    { name: 'Learning Vault', path: '/library', icon: '📚' },
    { name: 'Mock Exams', path: '/quizzes', icon: '📝' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Instantly closes the menu layer when navigating to the next page!
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* 📱 MODERN MOBILE STICKY NAVBAR HEADER */}
      <header className="md:hidden bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shadow-md sticky top-0 z-50 w-full">
        <h1 className="text-xl font-black tracking-wide">Janakpur Hub 🏫</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-2xl focus:outline-none p-1 rounded-xl bg-indigo-700 active:bg-indigo-800 transition px-3 py-1 font-bold"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* 📱 MODERN FULL-SCREEN NAVIGATION OVERLAY (Visible ONLY when menu is active on mobile phones) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-indigo-950 z-40 flex flex-col p-6 space-y-3 overflow-y-auto w-full h-[calc(100vh-60px)]">
          <div className="border-b border-indigo-900 pb-4 mb-4">
            <p className="text-xs text-indigo-400 font-extrabold tracking-wider uppercase">Active Account</p>
            <p className="text-lg font-black text-white truncate">{user?.name}</p>
            <p className="text-sm text-indigo-200 truncate">{user?.schoolName}</p>
          </div>

          <div className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center space-x-4 w-full text-left py-3.5 px-4 rounded-xl text-base font-bold transition duration-150 transform active:scale-95 ${
                  location.pathname === item.path 
                    ? 'bg-white text-indigo-950 shadow-xl' 
                    : 'text-indigo-100 hover:bg-indigo-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl text-center text-sm tracking-wide transition shadow-lg mt-auto mb-8 transform active:scale-95"
          >
            🚪 Sign Out Account
          </button>
        </div>
      )}

      {/* 💻 FIXED SIDEBAR INTERFACE - Visible ONLY on Large Laptops/Desktops */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white min-h-screen p-5 shadow-xl fixed left-0 top-0 bottom-0 z-30">
        <div className="mb-8 border-b border-indigo-800 pb-5">
          <h2 className="text-2xl font-black tracking-wide mb-1">Janakpur Hub</h2>
          <span className="bg-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest text-indigo-200">
            {user?.role} security node
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center space-x-3 w-full text-left py-3 px-4 rounded-xl font-bold transition duration-150 ${
                location.pathname === item.path ? 'bg-white text-indigo-950 shadow-md' : 'text-indigo-100 hover:bg-indigo-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-indigo-800 pt-4 mt-auto">
          <p className="text-sm font-black truncate">{user?.name}</p>
          <p className="text-xs text-indigo-400 truncate mb-4">{user?.schoolName}</p>
          <button
            onClick={handleLogoutClick}
            className="w-full bg-indigo-950 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 shadow transform active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 🚀 THE CONTENT VIEW ISOLATION CONTROLLER */}
      {/* pl-0 for clean full-width on mobile phones, md:pl-64 shifts space safely to accommodate desktop sidebars */}
      <main className="flex-1 pl-0 md:pl-64 min-h-screen w-full transition-all duration-200">
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
}

export default Layout;
