import React, { useEffect } from 'react';
import { resolveAvatarUrl } from '../utils/imageUtils';

function AvatarLightboxModal({ user, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const avatarUrl = resolveAvatarUrl(user);
  const userName = user.name || 'Classmate';
  const schoolName = user.schoolName || 'Jankapur High School';
  const classOrBatch = user.classOrBatch || 'Scholar';
  const role = user.role || 'Student';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full p-5 space-y-4 flex flex-col items-center transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
              📸 Profile DP
            </span>
            <span className="text-stone-400 text-xs font-bold truncate max-w-[150px]">
              {userName}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close photo"
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center font-bold text-sm transition active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* FULL SIZE PROFILE PHOTO */}
        <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner flex items-center justify-center group">
          <img
            src={avatarUrl}
            alt={userName}
            className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* USER CREDENTIALS CARD */}
        <div className="w-full text-center space-y-1 bg-stone-950/60 p-3 rounded-2xl border border-stone-800/80">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-black text-stone-100">{userName}</h3>
            <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.2 rounded-full">
              {role}
            </span>
          </div>
          <p className="text-xs font-bold text-amber-500/90">{classOrBatch}</p>
          <p className="text-[11px] text-stone-400 font-medium">🏫 {schoolName}</p>
        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition transform active:scale-95"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}

export default AvatarLightboxModal;
