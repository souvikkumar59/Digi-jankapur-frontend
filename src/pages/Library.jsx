import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// HELPER TO DYNAMICALLY LOAD THE RAZORPAY CHECKOUT SCRIPT
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Library() {
  const { token, user } = useContext(AuthContext);

  // FILE LISTING AND FILTER STATES
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolTag, setSchoolTag] = useState('');
  const [classLevel, setClassLevel] = useState('');

  // TEACHER WORKSPACE FORM STATES
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    schoolTag: 'Janakpur High School',
    classLevel: '',
    subject: '',
    fileUrl: '',
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
      const url = `https://smart-jankapur-backend.onrender.com//api/documents?schoolTag=${encodeURIComponent(
        schoolTag
      )}&classLevel=${encodeURIComponent(classLevel)}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDocuments(response.data.data);
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
  }, [token, schoolTag, classLevel]);

  // 2. TEACHER UPLOAD DOCUMENT HANDLER
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadSuccess('');
    setError('');

    try {
      const response = await axios.post(
        'https://smart-jankapur-backend.onrender.com//api/documents',
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setUploadSuccess('Resource published successfully!');

        setUploadData({
          title: '',
          description: '',
          schoolTag: 'Janakpur High School',
          classLevel: '',
          subject: '',
          fileUrl: '',
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

  // 3. RAZORPAY PAYMENT GATEWAY CHECKOUT
  const processCheckout = async (documentId) => {
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      alert('Network Alert: Failed to load payment gateway.');
      return;
    }

    try {
      const checkoutSession = await axios.post(
        'https://smart-jankapur-backend.onrender.com//api/payments/checkout',
        {
          purchaseType: 'document',
          documentItemId: documentId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const {
        id: razorpay_order_id,
        amount,
        currency
      } = checkoutSession.data.order;

      const modalOptions = {
        key: 'rzp_test_TcnnOXpowwNPle',
        amount: amount,
        currency: currency,
        name: 'Janakpur Hub Vault',
        description: 'Secure Micro-transaction checkout',
        order_id: razorpay_order_id,

        handler: async function (paymentResponse) {
          try {
            const verificationPayload = await axios.post(
              'https://smart-jankapur-backend.onrender.com//api/payments/verify',
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

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
      {/* SECTION TITLE */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">
          Learning Vault 📚
        </h1>
        <p className="text-gray-500 text-xs">
          Download study materials and premium past board exam papers.
        </p>
      </div>

      {/* TEACHER WORKSPACE ACTIONS PANEL */}
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 space-y-4">
          <h2 className="text-sm font-bold text-indigo-700">
            ✍️ Teacher Workspace: Publish Material
          </h2>

          {uploadSuccess && (
            <p className="text-green-600 text-xs font-bold">
              {uploadSuccess}
            </p>
          )}

          <form
            onSubmit={handleUploadSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-700"
          >
            <input
              type="text"
              required
              placeholder="Document Title"
              className="p-2.5 bg-gray-50 border rounded-xl outline-none"
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
              placeholder="Subject"
              className="p-2.5 bg-gray-50 border rounded-xl outline-none"
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
              className="p-2.5 bg-gray-50 border rounded-xl outline-none"
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
              placeholder="PDF File Link URL"
              className="p-2.5 bg-gray-50 border rounded-xl outline-none"
              value={uploadData.fileUrl}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  fileUrl: e.target.value
                })
              }
            />

            <select
              className="p-2.5 bg-gray-50 border rounded-xl outline-none text-gray-600"
              value={uploadData.schoolTag}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  schoolTag: e.target.value
                })
              }
            >
              <option value="Janakpur High School">
                Janakpur High School
              </option>
              <option value="Janakpur Primary School">
                Janakpur Primary School
              </option>
              <option value="Bodhi Bikash">Bodhi Bikash</option>
              <option value="Janakpur High Madrasha">
                Janakpur High Madrasha
              </option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="p-2.5 bg-gray-50 border rounded-xl outline-none text-gray-600"
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
                <option value="false">Free 🟢</option>
                <option value="true">Premium 🟡</option>
              </select>

              <input
                type="number"
                min="0"
                disabled={!uploadData.isPremium}
                placeholder="Price"
                className="p-2.5 bg-gray-50 border rounded-xl outline-none disabled:opacity-50"
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
              placeholder="Description..."
              className="col-span-1 sm:col-span-2 p-2.5 bg-gray-50 border rounded-xl outline-none h-16 resize-none"
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
              className="col-span-1 sm:col-span-2 w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs shadow hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {uploadLoading
                ? 'Publishing...'
                : 'Publish Study Document to Vault 📤'}
            </button>
          </form>
        </div>
      )}

      {/* FILTER SEARCH ROW INTERFACE PANEL */}
      <div className="bg-white p-3 rounded-2xl border flex flex-col sm:flex-row gap-2">
        <select
          className="w-full sm:flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700 outline-none"
          value={schoolTag}
          onChange={(e) => setSchoolTag(e.target.value)}
        >
          <option value="">All Schools 🏫</option>
          <option value="Janakpur High School">
            Janakpur High School
          </option>
          <option value="Janakpur Primary School">
            Janakpur Primary School
          </option>
          <option value="Bodhi Bikash">Bodhi Bikash</option>
          <option value="Janakpur High Madrasha">
            Janakpur High Madrasha
          </option>
        </select>

        <input
          type="text"
          placeholder="🎒 Class filter"
          className="w-full sm:w-48 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
        />
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
          {error}
        </p>
      )}

      {/* GRID CONTAINER OF CARD RESOURCES */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-gray-500 text-sm font-bold">
            No matching files inside the vault database.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Try changing your school or class filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {/* CARD HEADER */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {doc.title}
                  </h3>

                  <span
                    className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      doc.isPremium
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {doc.isPremium
                      ? `₹${doc.price} Premium`
                      : 'Free'}
                  </span>
                </div>

                {/* SUBJECT AND CLASS */}
                <p className="text-xs font-bold text-indigo-600 mb-3">
                  {doc.subject} • {doc.classLevel}
                </p>

                {/* DESCRIPTION */}
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {doc.description ||
                    'No descriptive overview notes provided.'}
                </p>

                {/* METADATA */}
                <div className="space-y-2 text-[11px] text-gray-500">
                  <p>
                    <span className="font-bold text-gray-700">
                      🏫 School:
                    </span>{' '}
                    {doc.schoolTag}
                  </p>

                  <p>
                    <span className="font-bold text-gray-700">
                      📥 Downloads:
                    </span>{' '}
                    {doc.downloadCount || 0}
                  </p>
                </div>
              </div>

              {/* CARD ACTION */}
              <div className="mt-5">
                {!doc.isPremium ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-emerald-600 text-white font-black text-center py-2.5 rounded-xl text-xs shadow-md hover:bg-emerald-700 transition"
                  >
                    Download File 📥
                  </a>
                ) : (
                  <button
                    onClick={() => processCheckout(doc._id)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-center py-2.5 rounded-xl text-xs shadow-md transition hover:from-amber-600 hover:to-amber-700"
                  >
                    Unlock PDF 💳
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;