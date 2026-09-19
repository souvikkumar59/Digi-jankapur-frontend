import React, { createContext, useContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

export const translations = {
  en: {
    // Top & Brand
    'brand.title': 'Jankapur Hub',
    'brand.subtitle': 'Scholar Network',
    'brand.campus': 'Academic Campus',
    'brand.schoolTag': 'Jankapur High School (Class 5–12)',
    'brand.schoolTagFull': 'Jankapur High School • 800 Scholars HQ • WBBSE & WBCHSE Center',

    // Roles & Tiers
    'role.student': 'Student Tier',
    'role.teacher': 'Faculty Member',
    'role.admin': 'Admin Headmaster',
    'role.verified': 'Verified Scholar',

    // Navigation
    'nav.community': 'Community Doubts',
    'nav.campus': 'JHS Campus Updates',
    'nav.directory': 'Classmate Directory',
    'nav.library': 'Vault & PYQs',
    'nav.quizzes': 'Mock Exams',
    'nav.signOut': 'Sign Out Account',

    // Common Buttons & Actions
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.open': 'Open',
    'common.view': 'View',
    'common.reset': 'Reset',

    // Campus Updates Page (/campus)
    'campus.heroTitle': 'Official Notice Board & Campus Live',
    'campus.heroDesc': 'Official announcements, weekly football/sports poll, daily Madhyamik logic boosters, and star student wall.',
    'campus.postNoticeBtn': '➕ Post School Notice',
    'campus.noticesHeading': 'Official School Notices',
    'campus.noticesSub': 'Verified announcements from Headmaster & Faculty',
    'campus.noNotices': 'No official notices posted yet.',
    'campus.pollTab': '⚽ Campus Match Poll',
    'campus.riddleTab': '🧩 Daily Riddle',
    'campus.voted': 'You have cast your vote in this poll!',
    'campus.votePrompt': '💡 Click any option above to cast your student vote!',
    'campus.studentsVoted': 'Students Voted',
    'campus.revealSolution': 'Reveal Solution & Explanation 💡',
    'campus.solutionHeader': '💡 Solution & Explanation:',
    'campus.wallHeading': 'Jankapur High School "Wall of Fame"',
    'campus.wallSub': 'Honoring our student achievers across Academics, Sports & Arts',
    'campus.addStarStudent': '➕ Add Star Student',
    'campus.editPollBtn': '✏️ Edit Poll',
    'campus.editRiddleBtn': '✏️ Edit Riddle',

    // Notice Modals
    'noticeModal.createTitle': '📢 Publish Official Campus Notice',
    'noticeModal.editTitle': '✏️ Edit Campus Notice',
    'noticeModal.titleLabel': 'Notice Title',
    'noticeModal.badgeLabel': 'Notice Badge / Category',
    'noticeModal.dateLabel': 'Event Date / Schedule Text',
    'noticeModal.contentLabel': 'Notice Details & Instructions',
    'noticeModal.publishBtn': 'Publish Notice',

    // Poll Modal
    'pollModal.title': '✏️ Edit Campus Match Poll',
    'pollModal.questionLabel': 'Poll Question',
    'pollModal.badgeLabel': 'Poll Category / Badge',
    'pollModal.resetLabel': 'Reset all student votes to zero',

    // Riddle Modal
    'riddleModal.title': '✏️ Edit Daily Brain Teaser',
    'riddleModal.questionLabel': 'Riddle / Math Question',
    'riddleModal.subtextLabel': 'Category / Exam Tag',
    'riddleModal.answerLabel': 'Detailed Solution & Explanation',

    // Spotlight Modal
    'spotlightModal.createTitle': '🏆 Honor a Star Student',
    'spotlightModal.editTitle': '✏️ Edit Star Student Entry',
    'spotlightModal.nameLabel': 'Student Name & Class',
    'spotlightModal.titleLabel': 'Award / Achievement Title',
    'spotlightModal.descLabel': 'Description & Story',

    // Dashboard Page (/dashboard)
    'dashboard.gatewayTitle': 'Jankapur High School Official Notice Board & Updates',
    'dashboard.gatewayTag': 'Live Portal',
    'dashboard.gatewayDesc': 'Official school notices, weekly match polls, daily logic boosters, and scholar spotlight.',
    'dashboard.gatewayBtn': 'Open JHS Updates',
    'dashboard.quickMock': 'Mock Exam Hall',
    'dashboard.quickTakeTest': 'Take Test 📝',
    'dashboard.quickVault': 'Learning Vault',
    'dashboard.quickPyqs': 'Solved PYQs 📜',
    'dashboard.quickDirectory': 'Classmate Directory',
    'dashboard.quickPeers': '800 Peers 👥',
    'dashboard.quickMyActivity': 'My Activity',
    'dashboard.quickMyDoubts': 'My Doubts ⭐',
    'dashboard.feedAll': '🌐 All Campus Feed',
    'dashboard.feedMyQuestions': '🙋‍♂️ My Questions',
    'dashboard.askDoubtTitle': 'Ask a Doubt, Share Homework, or Post Campus Update',
    'dashboard.postPlaceholder': 'What study doubt, homework problem, or campus update would you like to discuss?',
    'dashboard.postBtn': 'Post to Community',
    'dashboard.posting': 'Publishing...',
    'dashboard.filterTopic': 'Filter Topic',
    'dashboard.noPosts': 'No questions found in this topic.',
  },

  bn: {
    // Top & Brand
    'brand.title': 'জানকাপুর হাব',
    'brand.subtitle': 'শিক্ষার্থী নেটওয়ার্ক',
    'brand.campus': 'একাডেমিক ক্যাম্পাস',
    'brand.schoolTag': 'জানকাপুর হাই স্কুল (ক্লাস ৫–১২)',
    'brand.schoolTagFull': 'জানকাপুর হাই স্কুল • ৮০০ শিক্ষার্থী হেডকোয়ার্টার • WBBSE ও WBCHSE কেন্দ্র',

    // Roles & Tiers
    'role.student': 'শিক্ষার্থী স্তর',
    'role.teacher': 'শিক্ষক মহাশয়',
    'role.admin': 'প্রধান শিক্ষক (অ্যাডমিন)',
    'role.verified': 'ভেরিফায়েড শিক্ষার্থী',

    // Navigation
    'nav.community': 'প্রশ্নোত্তর ফোরাম',
    'nav.campus': 'জেএইচএস ক্যাম্পাস আপডেট',
    'nav.directory': 'সহপাঠী ডিরেক্টরি',
    'nav.library': 'প্রশ্নপত্র ও স্টাডি ভল্ট',
    'nav.quizzes': 'মক টেস্ট ও পরীক্ষা',
    'nav.signOut': 'অ্যাকাউন্ট লগ আউট',

    // Common Buttons & Actions
    'common.save': 'পরিবর্তন সংরক্ষণ করুন',
    'common.cancel': 'বাতিল করুন',
    'common.edit': 'সম্পাদনা',
    'common.delete': 'মুছে ফেলুন',
    'common.close': 'বন্ধ করুন',
    'common.submit': 'জমা দিন',
    'common.loading': 'লোড হচ্ছে...',
    'common.success': 'সফল',
    'common.open': 'খুলুন',
    'common.view': 'দেখুন',
    'common.reset': 'রিসেট',

    // Campus Updates Page (/campus)
    'campus.heroTitle': 'অফিশিয়াল নোটিশ বোর্ড ও ক্যাম্পাস লাইভ',
    'campus.heroDesc': 'প্রধান শিক্ষক ও শিক্ষকবৃন্দের জরুরি নোটিশ, সাপ্তাহিক খেলাধুলো পোল, দৈনিক লজিক ধাঁধা এবং কৃতী ছাত্রছাত্রীদের দেওয়াল।',
    'campus.postNoticeBtn': '➕ নতুন নোটিশ প্রকাশ করুন',
    'campus.noticesHeading': 'অফিশিয়াল স্কুল নোটিশ বোর্ড',
    'campus.noticesSub': 'প্রধান শিক্ষক ও শিক্ষকবৃন্দের স্বাক্ষরিত বিজ্ঞপ্তি',
    'campus.noNotices': 'এখনও কোনো নোটিশ প্রকাশিত হয়নি।',
    'campus.pollTab': '⚽ ক্যাম্পাস ম্যাচ পোল',
    'campus.riddleTab': '🧩 দৈনিক লজিক ধাঁধা',
    'campus.voted': 'আপনি এই পোলে ভোট দিয়েছেন!',
    'campus.votePrompt': '💡 আপনার পছন্দের অপশনে ক্লিক করে ভোট দিন!',
    'campus.studentsVoted': 'জন শিক্ষার্থী ভোট দিয়েছে',
    'campus.revealSolution': 'উত্তর ও ব্যাখ্যা দেখুন 💡',
    'campus.solutionHeader': '💡 সঠিক সমাধান ও যুক্তি:',
    'campus.wallHeading': 'জানকাপুর হাই স্কুল "ওয়াল অব ফেম"',
    'campus.wallSub': 'পড়াশোনা, বিজ্ঞান মেলা ও খেলাধুলোয় আমাদের সেরা ছাত্রছাত্রী',
    'campus.addStarStudent': '➕ সেরা শিক্ষার্থী যুক্ত করুন',
    'campus.editPollBtn': '✏️ পোল সম্পাদনা',
    'campus.editRiddleBtn': '✏️ ধাঁধা সম্পাদনা',

    // Notice Modals
    'noticeModal.createTitle': '📢 নতুন স্কুল নোটিশ প্রকাশ করুন',
    'noticeModal.editTitle': '✏️ স্কুল নোটিশ সম্পাদনা করুন',
    'noticeModal.titleLabel': 'নোটিশের শিরোনাম',
    'noticeModal.badgeLabel': 'নোটিশ বিভাগ / ক্যাটাগরি',
    'noticeModal.dateLabel': 'তারিখ বা সময়সূচি',
    'noticeModal.contentLabel': 'বিস্তারিত বিজ্ঞপ্তি ও নির্দেশিকা',
    'noticeModal.publishBtn': 'নোটিশ প্রকাশ করুন',

    // Poll Modal
    'pollModal.title': '✏️ ক্যাম্পাস ম্যাচ পোল সম্পাদনা',
    'pollModal.questionLabel': 'পোলের প্রশ্ন',
    'pollModal.badgeLabel': 'বিভাগ / ব্যাজ',
    'pollModal.resetLabel': 'সকল শিক্ষার্থীর ভোট শূন্য (০) করুন',

    // Riddle Modal
    'riddleModal.title': '✏️ দৈনিক ধাঁধা ও লজিক সম্পাদনা',
    'riddleModal.questionLabel': 'ধাঁধা বা গণিত প্রশ্ন',
    'riddleModal.subtextLabel': 'পরীক্ষা বা বিভাগ ট্যাগ',
    'riddleModal.answerLabel': 'বিস্তারিত উত্তর ও গাণিতিক যুক্তি',

    // Spotlight Modal
    'spotlightModal.createTitle': '🏆 কৃতী শিক্ষার্থীকে সম্মান জানান',
    'spotlightModal.editTitle': '✏️ কৃতী শিক্ষার্থীর তথ্য পরিবর্তন',
    'spotlightModal.nameLabel': 'শিক্ষার্থীর নাম ও শ্রেণি',
    'spotlightModal.titleLabel': 'কৃতিত্ব বা মেডেলের বিবরণ',
    'spotlightModal.descLabel': 'সংক্ষিপ্ত বিবরণী ও গল্প',

    // Dashboard Page (/dashboard)
    'dashboard.gatewayTitle': 'জানকাপুর হাই স্কুল অফিশিয়াল নোটিশ ও ক্যাম্পাস আপডেট',
    'dashboard.gatewayTag': 'লাইভ পোর্টাল',
    'dashboard.gatewayDesc': 'অফিশিয়াল স্কুল নোটিশ, সাপ্তাহিক ম্যাচ পোল, মাধ্যমিকের লজিক বুস্টার এবং কৃতী ছাত্রছাত্রীদের সম্মাননা।',
    'dashboard.gatewayBtn': 'জেএইচএস আপডেট দেখুন',
    'dashboard.quickMock': 'মক টেস্ট হল',
    'dashboard.quickTakeTest': 'পরীক্ষা দিন 📝',
    'dashboard.quickVault': 'স্টাডি ভল্ট',
    'dashboard.quickPyqs': 'সমাধানকৃত PYQ 📜',
    'dashboard.quickDirectory': 'সহপাঠী ডিরেক্টরি',
    'dashboard.quickPeers': '৮০০ সহপাঠী 👥',
    'dashboard.quickMyActivity': 'আমার অ্যাক্টিভিটি',
    'dashboard.quickMyDoubts': 'আমার প্রশ্নসমূহ ⭐',
    'dashboard.feedAll': '🌐 সকল ক্যাম্পাস আলোচনা',
    'dashboard.feedMyQuestions': '🙋‍♂️ আমার প্রশ্নসমূহ',
    'dashboard.askDoubtTitle': 'পড়াশোনার ডাউট, হোমওয়ার্ক বা ক্যাম্পাসের খবর পোস্ট করুন',
    'dashboard.postPlaceholder': 'আপনার কোন বিষয়ে সাহায্য বা আলোচনা প্রয়োজন? এখানে লিখুন...',
    'dashboard.postBtn': 'পোস্ট করুন',
    'dashboard.posting': 'পোস্ট হচ্ছে...',
    'dashboard.filterTopic': 'বিষয় নির্বাচন',
    'dashboard.noPosts': 'এই বিষয়ে কোনো প্রশ্ন পাওয়া যায়নি।',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('smart_jhs_lang') || 'bn'; // Default to Bengali for Jankapur High School
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('smart_jhs_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  const t = (key, fallback) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
