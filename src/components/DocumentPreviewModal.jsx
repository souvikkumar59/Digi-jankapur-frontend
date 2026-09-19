import React, { useEffect, useState } from 'react';

function DocumentPreviewModal({ document, isOpen, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.document.body.style.overflow = 'unset';
    };
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      {/* BACKDROP CLICK DISMISS */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* MODAL CARD CONTAINER */}
      <div
        className={`relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full max-w-none rounded-none'
            : 'w-full max-w-4xl h-[90vh] sm:h-[85vh]'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                {document.category === 'PYQ' ? '📜 Previous Year Question' : '📚 Study Vault'}
              </span>
              {document.year && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Exam Year {document.year}
                </span>
              )}
              {document.examType && document.examType !== 'General' && (
                <span className="bg-slate-800 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  {document.examType}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white truncate">
              {document.title}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {document.subject} • {document.classLevel} • {document.schoolTag}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* FULLSCREEN TOGGLE */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold"
            >
              {isFullscreen ? 'Exit ⛶' : '⛶'}
            </button>

            {/* DIRECT NEW TAB OPEN */}
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            >
              <span>New Tab</span>
              <span>↗</span>
            </a>

            {/* DOWNLOAD BUTTON */}
            <a
              href={document.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow transition transform active:scale-95"
            >
              <span>Download</span>
              <span>📥</span>
            </a>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition font-bold text-sm ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* DOCUMENT PREVIEW CONTAINER */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          <iframe
            src={document.fileUrl}
            title={document.title}
            className="w-full h-full border-0 bg-white"
            loading="lazy"
          />

          {/* FALLBACK / QUICK OVERLAY BAR */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-800">Note:</span>
              <span className="text-[11px] truncate">
                If the PDF preview does not load directly inside your browser window, click "New Tab" or "Download".
              </span>
            </div>
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-bold hover:underline shrink-0 ml-2"
            >
              Open External Link ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreviewModal;
