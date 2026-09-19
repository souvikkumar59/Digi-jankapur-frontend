import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: t('nav.community', 'Community Doubts'), path: '/dashboard', icon: '💬' },
    { name: t('nav.campus', 'JHS Campus Updates'), path: '/campus', icon: '🏫' },
    { name: t('nav.directory', 'Classmate Directory'), path: '/directory', icon: '👥' },
    { name: t('nav.library', 'Vault & PYQs'), path: '/library', icon: '📚' },
    { name: t('nav.quizzes', 'Mock Exams'), path: '/quizzes', icon: '📝' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return t('role.admin', 'Admin Headmaster');
    if (user?.role === 'teacher') return t('role.teacher', 'Faculty Member');
    return t('role.student', 'Student Tier');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col md:flex-row text-stone-900 font-sans">
      
      {/* 📱 MODERN MOBILE STICKY NAVBAR HEADER */}
      <header className="md:hidden bg-stone-900 text-white px-4 py-3 flex items-center justify-between shadow-xl border-b border-stone-800 sticky top-0 z-50 w-full">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏛️</span>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">
              Jankapur <span className="text-amber-400 font-black">Hub</span>
            </h1>
            <p className="text-[9px] text-amber-300/80 font-bold uppercase tracking-widest">
              {t('brand.subtitle', 'Scholar Network')}
            </p>
          </div>
        </div>

        {/* MOBILE CONTROLS: LANGUAGE SWITCHER + HAMBURGER */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-stone-800 border border-stone-700 text-amber-400 hover:border-amber-400/80 active:scale-95 transition flex items-center gap-1 shadow-sm"
            title="Switch Language (English / বাংলা)"
          >
            <span>🌐</span>
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-lg focus:outline-none p-2 rounded-xl bg-stone-800 border border-stone-700 text-amber-400 active:scale-95 transition font-bold"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* 📱 MODERN FULL-SCREEN NAVIGATION OVERLAY FOR MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-stone-900 z-40 flex flex-col p-6 space-y-4 overflow-y-auto w-full h-[calc(100vh-57px)] border-t border-stone-800">
          <div className="border-b border-stone-800 pb-4">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1.5">
              {t('role.verified', 'Verified Scholar')}
            </span>
            <p className="text-lg font-black text-white truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.schoolName}</p>
          </div>

          {/* MOBILE MENU LANGUAGE TOGGLE */}
          <div className="bg-stone-950/80 p-1.5 rounded-2xl border border-stone-800 flex items-center shadow-inner">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 ${
                language === 'en'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>🌐 English</span>
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 ${
                language === 'bn'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>🌐 বাংলা</span>
            </button>
          </div>

          <div className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-4 w-full text-left py-3.5 px-4 rounded-2xl text-sm font-bold transition duration-150 transform active:scale-95 ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/25' 
                      : 'text-stone-300 hover:text-amber-300 hover:bg-stone-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-2xl text-center text-xs tracking-wider uppercase transition shadow-lg mt-auto mb-6 transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>{t('nav.signOut', 'Sign Out Account')}</span>
          </button>
        </div>
      )}

      {/* 💻 FIXED SIDEBAR INTERFACE - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-white min-h-screen p-5 shadow-2xl fixed left-0 top-0 bottom-0 z-30 border-r border-stone-800">
        <div className="mb-5 border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-800 to-amber-950 border border-stone-700 flex items-center justify-center text-xl shadow-md">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                Jankapur <span className="text-amber-400">Hub</span>
              </h2>
              <p className="text-[9px] text-amber-300/70 font-black uppercase tracking-widest">
                {t('brand.campus', 'Academic Campus')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              {getRoleLabel()}
            </span>
          </div>
        </div>

        {/* 🌐 DESKTOP SEGMENTED LANGUAGE TOGGLE */}
        <div className="mb-4 bg-stone-950/90 p-1 rounded-2xl border border-stone-800 flex items-center shadow-inner">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 ${
              language === 'en'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>English</span>
          </button>
          <button
            onClick={() => setLanguage('bn')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 ${
              language === 'bn'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>বাংলা</span>
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center space-x-3 w-full text-left py-3 px-4 rounded-2xl font-bold text-xs transition duration-150 transform active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/25' 
                    : 'text-stone-300 hover:text-amber-300 hover:bg-stone-800/80'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* BOTTOM USER PROFILE CARD */}
        <div className="border-t border-stone-800 pt-4 mt-auto">
          <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700/80 mb-3">
            <p className="text-xs font-black text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-amber-300/90 font-bold truncate mt-0.5">{user?.schoolName}</p>
          </div>
          <button
            onClick={handleLogoutClick}
            className="w-full bg-stone-800/80 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 border border-stone-700/70 hover:border-rose-700/50 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🚪</span>
            <span>{t('nav.signOut', 'Sign Out')}</span>
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT CONTAINER */}
      <main className="flex-1 pl-0 md:pl-64 min-h-screen w-full transition-all duration-200 bg-[#faf8f5]">
        <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
}

export default Layout;
