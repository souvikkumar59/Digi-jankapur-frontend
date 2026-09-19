import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  fetchDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
  createPaymentCheckoutApi,
  verifyPaymentApi,
} from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

// HELPER TO DYNAMICALLY LOAD THE RAZORPAY CHECKOUT SCRIPT
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Library() {
  const { token, user } = useContext(AuthContext);

  // FILE LISTING, TABS, AND FILTER STATES
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pyq'
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolTag, setSchoolTag] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // DOCUMENT DELETION STATE
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // DOCUMENT PREVIEW MODAL STATE
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // TEACHER WORKSPACE FORM STATES
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    schoolTag: 'Jankapur High School',
    classLevel: '',
    subject: '',
    fileUrl: '',
    category: 'Notes',
    year: '',
    examType: 'General',
    isPremium: false,
    price: 0
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');


  // 1. FETCH MATERIALS FROM BACKEND API
  const fetchMaterials = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchDocumentsApi({
        schoolTag: schoolTag || undefined,
        classLevel: classLevel || undefined,
        category: activeTab === 'pyq' ? 'PYQ' : undefined,
        year: selectedYear || undefined,
        examType: selectedExamType || undefined,
        search: searchQuery || undefined,
      });

      if (response.data.success) {
        setDocuments(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to populate vault files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMaterials();
    }
  }, [token, schoolTag, classLevel, activeTab, selectedYear, selectedExamType, searchQuery]);

  // 2. TEACHER UPLOAD DOCUMENT HANDLER
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadSuccess('');
    setError('');

    try {
      const response = await uploadDocumentApi(uploadData);

      if (response.data.success) {
        setUploadSuccess('Resource published successfully!');

        setUploadData({
          title: '',
          description: '',
          schoolTag: 'Jankapur High School',
          classLevel: '',
          subject: '',
          fileUrl: '',
          category: activeTab === 'pyq' ? 'PYQ' : 'Notes',
          year: '',
          examType: 'General',
          isPremium: false,
          price: 0
        });

        fetchMaterials();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Upload transmission rejected.'
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // 3. ADMIN & FACULTY DOCUMENT DELETION HANDLER
  const handleDeleteDocument = async (docId, title) => {
    const isConfirmed = window.confirm(
      `⚠️ ADMIN / FACULTY CONFIRMATION:\n\nAre you sure you want to permanently delete "${title || 'this PDF'}" from the Vault?\n\nThis will erase the document from the academic database for all students.`
    );
    if (!isConfirmed) return;

    setDeleteLoadingId(docId);
    setError('');
    setDeleteSuccess('');

    try {
      const response = await deleteDocumentApi(docId);
      if (response.data.success) {
        setDeleteSuccess(`"${title || 'Document'}" was permanently deleted from the vault.`);
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        setTimeout(() => setDeleteSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document from vault.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // 4. RAZORPAY PAYMENT GATEWAY CHECKOUT
  const processCheckout = async (documentId) => {

    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      alert('Network Alert: Failed to load payment gateway.');
      return;
    }

    try {
      const checkoutSession = await createPaymentCheckoutApi({
        purchaseType: 'document',
        documentItemId: documentId
      });

      const {
        id: razorpay_order_id,
        amount,
        currency
      } = checkoutSession.data.order;

      const modalOptions = {
        key: 'rzp_test_TcnnOXpowwNPle',
        amount: amount,
        currency: currency,
        name: 'Jankapur Hub Vault',
        description: 'Secure Micro-transaction checkout',
        order_id: razorpay_order_id,

        handler: async function (paymentResponse) {
          try {
            const verificationPayload = await verifyPaymentApi({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            if (verificationPayload.data.success) {
              alert(
                '🎉 Micro-payment successful! Your document is permanently unlocked.'
              );

              fetchMaterials();
            }
          } catch (verifyErr) {
            alert('Security Alert: Payment verification failed.');
          }
        },

        prefill: {
          name: user?.name || '',
          contact: user?.phoneNumber || ''
        },

        theme: {
          color: '#4f46e5'
        }
      };

      const paymentWindow = new window.Razorpay(modalOptions);
      paymentWindow.open();
    } catch (err) {
      alert(
        'Checkout Initiation Failure: ' +
          (err.response?.data?.message || err.message)
      );
    }
    };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* HEADER ROW WITH VAULT TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Learning Vault & PYQs 📚</h1>
            <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Academic Vault
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-0.5 font-medium">
            Download study resources, lecture notes, and past board examination papers.
          </p>
        </div>

        {/* PRIMARY VAULT TABS */}
        <div className="flex items-center gap-2 bg-stone-200/80 p-1.5 rounded-2xl self-start sm:self-auto border border-stone-300">
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedYear('');
              setSelectedExamType('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'all'
                ? 'bg-stone-900 text-amber-400 shadow-sm font-black'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            All Materials 📚
          </button>
          <button
            onClick={() => setActiveTab('pyq')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
              activeTab === 'pyq'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/25 font-black'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <span>Past Papers (PYQs) 📜</span>
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
              activeTab === 'pyq' ? 'bg-stone-950 text-amber-400' : 'bg-amber-400 text-stone-950'
            }`}>New</span>
          </button>
        </div>
      </div>

      {/* DEDICATED PYQ HERO BANNER */}
      {activeTab === 'pyq' && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xl">📜</span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Previous Year Question (PYQ) Archive
              </h2>
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Solved Papers & Keys
              </span>
            </div>
            <p className="text-xs text-stone-300 max-w-xl">
              Access authentic past board papers, selection tests, and model question papers curated by village teachers to prepare for upcoming examinations.
            </p>
          </div>
          <div className="bg-stone-800/90 px-4 py-2.5 rounded-2xl border border-stone-700 text-center shrink-0 self-stretch sm:self-auto">
            <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">PYQ Papers</p>
            <p className="text-xl font-black text-white mt-0.5">
              {documents.filter((d) => d.category === 'PYQ' || d.year).length} Available
            </p>
          </div>
        </div>
      )}

      {/* TEACHER WORKSPACE ACTIONS PANEL */}
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                ✍️ Faculty Desk: Publish Study Material & PYQs
              </h2>
              <p className="text-[11px] text-slate-500">
                Upload class notes or past examination papers with solution links.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
              Faculty Access
            </span>
          </div>

          {uploadSuccess && (
            <p className="text-emerald-700 text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              {uploadSuccess}
            </p>
          )}

          <form
            onSubmit={handleUploadSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700"
          >
            <input
              type="text"
              required
              placeholder="Document Title (e.g. 2024 Madhyamik Math Paper)"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              value={uploadData.title}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  title: e.target.value
                })
              }
            />

            <input
              type="text"
              required
              placeholder="Subject (e.g. Mathematics, Physical Science)"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              value={uploadData.subject}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  subject: e.target.value
                })
              }
            />

            <input
              type="text"
              required
              placeholder="Class (e.g. Class 10)"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              value={uploadData.classLevel}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  classLevel: e.target.value
                })
              }
            />

            <input
              type="url"
              required
              placeholder="PDF File Link URL (Google Drive, Cloudinary, etc.)"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              value={uploadData.fileUrl}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  fileUrl: e.target.value
                })
              }
            />

            {/* MATERIAL TYPE (NOTES VS PYQ) */}
            <select
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 focus:ring-2 focus:ring-indigo-500"
              value={uploadData.category}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  category: e.target.value
                })
              }
            >
              <option value="Notes">General Study Notes 📚</option>
              <option value="PYQ">Previous Year Question (PYQ) 📜</option>
              <option value="Model Paper">Model Question Paper 📝</option>
              <option value="Assignment">Classroom Assignment ✏️</option>
            </select>

            {/* EXAM YEAR (IF PYQ) */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="2015"
                max="2030"
                placeholder="Exam Year (e.g. 2024)"
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                value={uploadData.year}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    year: e.target.value
                  })
                }
              />

              <select
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 focus:ring-2 focus:ring-indigo-500"
                value={uploadData.examType}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    examType: e.target.value
                  })
                }
              >
                <option value="General">General Exam</option>
                <option value="Madhyamik / Board">Madhyamik / Board</option>
                <option value="Pre-Board / Selection Test">Pre-Board / Selection</option>
                <option value="Midterm Examination">Midterm Examination</option>
                <option value="Annual Exam">Annual Exam</option>
                <option value="Model Question Paper">Model Paper</option>
              </select>
            </div>

            <select
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 focus:ring-2 focus:ring-indigo-500"
              value={uploadData.schoolTag}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  schoolTag: e.target.value
                })
              }
            >
              <option value="Jankapur High School">
                Jankapur High School
              </option>
              <option value="Jankapur Primary School">
                Jankapur Primary School
              </option>
              <option value="Bodhi Bikash">Bodhi Bikash</option>
              <option value="Jankapur High Madrasha">
                Jankapur High Madrasha
              </option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 focus:ring-2 focus:ring-indigo-500"
                value={uploadData.isPremium}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    isPremium: e.target.value === 'true',
                    price:
                      e.target.value === 'false'
                        ? 0
                        : uploadData.price
                  })
                }
              >
                <option value="false">Free Access 🟢</option>
                <option value="true">Premium Paper 🟡</option>
              </select>

              <input
                type="number"
                min="0"
                disabled={!uploadData.isPremium}
                placeholder="Price (₹)"
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 text-slate-900"
                value={uploadData.price}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    price: parseInt(e.target.value, 10) || 0
                  })
                }
              />
            </div>

            <textarea
              placeholder="Description of the material or syllabus covered..."
              className="col-span-1 sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
              value={uploadData.description}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  description: e.target.value
                })
              }
            />

            <button
              type="submit"
              disabled={uploadLoading}
              className="col-span-1 sm:col-span-2 w-full bg-stone-900 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-white font-black py-3.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              {uploadLoading
                ? 'Publishing to Vault...'
                : 'Publish Study Document to Vault 📤'}
            </button>
          </form>
        </div>
      )}

      {/* MULTI-FACET FILTER SEARCH ROW */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="🔍 Search by paper title, subject, or year..."
            className="w-full sm:flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none w-full sm:w-52 focus:ring-2 focus:ring-indigo-500"
            value={schoolTag}
            onChange={(e) => setSchoolTag(e.target.value)}
          >
            <option value="">All Schools 🏫</option>
            <option value="Jankapur High School">Jankapur High School</option>
            <option value="Jankapur Primary School">Jankapur Primary School</option>
            <option value="Bodhi Bikash">Bodhi Bikash</option>
            <option value="Jankapur High Madrasha">Jankapur High Madrasha</option>
          </select>

          <input
            type="text"
            placeholder="🎒 Class (e.g. Class 10)"
            className="w-full sm:w-44 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
          />
        </div>

        {/* PYQ SPECIFIC SECONDARY FILTERS ROW */}
        {activeTab === 'pyq' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Exam Filters:</span>
            
            <select
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years 📅</option>
              <option value="2025">2025 Papers</option>
              <option value="2024">2024 Papers</option>
              <option value="2023">2023 Papers</option>
              <option value="2022">2022 Papers</option>
              <option value="2021">2021 Papers</option>
              <option value="2020">2020 Papers</option>
            </select>

            <select
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
            >
              <option value="">All Exam Types 📝</option>
              <option value="Madhyamik / Board">Madhyamik / Board</option>
              <option value="Pre-Board / Selection Test">Pre-Board / Selection Test</option>
              <option value="Midterm Examination">Midterm Examination</option>
              <option value="Annual Exam">Annual Exam</option>
              <option value="Model Question Paper">Model Paper</option>
            </select>

            {(selectedYear || selectedExamType || searchQuery || schoolTag || classLevel) && (
              <button
                onClick={() => {
                  setSelectedYear('');
                  setSelectedExamType('');
                  setSearchQuery('');
                  setSchoolTag('');
                  setClassLevel('');
                }}
                className="px-2.5 py-1.5 text-xs text-indigo-600 font-bold hover:underline"
              >
                Clear Filters ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUCCESS / DELETION MESSAGE */}
      {deleteSuccess && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl border border-emerald-200 text-xs font-black flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>{deleteSuccess}</span>
          </div>
          <button
            onClick={() => setDeleteSuccess('')}
            className="text-emerald-700 hover:text-emerald-950 font-black px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-2xl border border-red-100">
          {error}
        </p>
      )}

      {/* GRID CONTAINER OF CARD RESOURCES */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-200 border-b-amber-500"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-stone-800 text-sm font-bold">
            No matching documents inside the vault database.
          </p>
          <p className="text-stone-400 text-xs mt-1">
            Try adjusting your search criteria, year, or school filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => {
            const isPYQ = doc.category === 'PYQ' || !!doc.year;
            const isUploader = doc.uploadedBy && (
              doc.uploadedBy === user?.id ||
              doc.uploadedBy === user?._id ||
              doc.uploadedBy?._id === user?.id ||
              doc.uploadedBy?._id === user?._id
            );
            const canDelete = user?.role === 'admin' || isUploader;

            return (
              <div
                key={doc._id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:shadow-xl hover:border-amber-400 transition flex flex-col justify-between"
              >
                {/* CARD HEADER */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPYQ ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                          🎓 {doc.year ? `${doc.year} ` : ''}{doc.examType && doc.examType !== 'General' ? doc.examType : 'PYQ'}
                        </span>
                      ) : (
                        <span className="bg-stone-100 text-stone-700 border border-stone-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                          Notes
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`shrink-0 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          doc.isPremium
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {doc.isPremium
                          ? `₹${doc.price} Premium`
                          : 'Free'}
                      </span>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteDocument(doc._id, doc.title)}
                          disabled={deleteLoadingId === doc._id}
                          title="Delete PDF from Vault"
                          className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-200 text-xs"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-stone-900 leading-tight mb-1">
                    {doc.title}
                  </h3>

                  {/* SUBJECT AND CLASS */}
                  <p className="text-xs font-bold text-stone-700 mb-2">
                    {doc.subject} • <span className="text-amber-800 font-black">{doc.classLevel}</span>
                  </p>

                  {/* DESCRIPTION */}
                  <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                    {doc.description || 'No descriptive overview notes provided.'}
                  </p>

                  {/* METADATA */}
                  <div className="space-y-1.5 text-[11px] text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-150">
                    <p>
                      <span className="font-bold text-stone-800">🏫 School:</span>{' '}
                      {doc.schoolTag}
                    </p>
                    <p>
                      <span className="font-bold text-stone-800">👤 Uploaded by:</span>{' '}
                      {doc.uploadedBy?.name || 'Academic Faculty'}
                    </p>
                    <p>
                      <span className="font-bold text-stone-800">📥 Downloads:</span>{' '}
                      {doc.downloadCount || 0}
                    </p>
                  </div>
                </div>

                {/* CARD ACTIONS: PREVIEW + DOWNLOAD/UNLOCK + DELETE */}
                <div className="mt-5 space-y-2">
                  {!doc.isPremium ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setPreviewDocument(doc);
                          setIsPreviewOpen(true);
                        }}
                        className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-center py-2.5 rounded-xl text-xs transition border border-stone-200 hover:border-amber-300"
                      >
                        Preview PDF 👁️
                      </button>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-stone-900 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-white font-black text-center py-2.5 rounded-xl text-xs shadow-md transition transform active:scale-95 flex items-center justify-center gap-1"
                      >
                        Download 📥
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => processCheckout(doc._id)}
                      className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-center py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition transform active:scale-95"
                    >
                      Unlock Paper for ₹{doc.price} 💳
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteDocument(doc._id, doc.title)}
                      disabled={deleteLoadingId === doc._id}
                      className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 hover:border-red-300 font-bold text-center py-2 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>🗑️</span>
                      <span>{deleteLoadingId === doc._id ? 'Deleting PDF...' : 'Delete PDF from Vault'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* IN-APP DOCUMENT PREVIEW MODAL */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
      />
    </div>
  );
}

export default Library;