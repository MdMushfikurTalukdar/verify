import React, { useState, useEffect } from 'react';
import { fetchCertificateById } from './sheetApi';
import './App.css';

/* ---------------- Static footer ---------------- */
const footerInfo = {
  helpline: '+8809660616253, 16253',
  pabx: '+88 02223381614',
  fax: '880-2-9564009',
  email: 'info@bankverifierbd.com',
  address:
    'Head Office, 26 Dilkusha Commercial Area, Dhaka 1000, Bangladesh',
};

// 👉 Put your real website URL here (or leave empty and it will fall back)
const WEBSITE_URL = 'https://example.com';

/* ---------------- Helper components ---------------- */
function InfoField({ label, value, alignRight = false }) {
  return (
    <div className={alignRight ? 'md:text-right' : ''}>
      <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
        {label}
      </span>
      <span className="font-bold text-slate-900 text-sm md:text-base">
        {value || '—'}
      </span>
    </div>
  );
}

function FooterItem({ icon, label, children, isLink = false }) {
  return (
    <div className="flex items-center gap-2">
      <i className={`${icon} text-emerald-700 w-4 text-center`}></i>
      <span>
        <strong>{label}:</strong>{' '}
        {isLink ? (
          <a
            href={`mailto:${children}`}
            className="hover:underline text-slate-700"
          >
            {children}
          </a>
        ) : (
          children
        )}
      </span>
    </div>
  );
}

/* ---------------- Format helpers ---------------- */
const formatBDT = (n) => {
  if (n === '' || n === null || n === undefined) return '—';
  const num = Number(n);
  if (isNaN(num)) return n;
  return '৳' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const formatEUR = (n) => {
  if (n === '' || n === null || n === undefined) return '—';
  const num = Number(n);
  if (isNaN(num)) return n;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2 });
};

/* ---------------- Main App ---------------- */
function App() {
  const [certId, setCertId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read ?id= from URL on mount, then fetch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl =
      params.get('id') ||
      params.get('certificate') ||
      params.get('cert');

    if (idFromUrl) {
      setCertId(idFromUrl);
      loadCertificate(idFromUrl);
    }
  }, []);

  const loadCertificate = async (id) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const row = await fetchCertificateById(id);
      if (!row) {
        setError(`No record found for Certificate ID: ${id}`);
      } else {
        setData(row);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (certId.trim()) loadCertificate(certId.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-800 antialiased bg-[#edf4f0]">
      {/* ============ Header ============ */}
      <header className="bg-[#035938] text-white px-4 md:px-12 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg hidden sm:block">
              <i className="fa-solid fa-file-circle-check text-xl text-emerald-300"></i>
            </div>
            <div className="border-l-0 sm:border-l sm:border-emerald-600 sm:pl-3">
              <span className="text-lg md:text-xl font-semibold tracking-wide">
                Document Verifier
              </span>
            </div>
          </div>

          {/* ✅ Fixed: real href instead of "#" */}
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-500/40 px-5 py-1.5 rounded-full text-xs md:text-sm font-medium transition duration-200 shadow-sm flex items-center gap-2"
          >
            <span>Visit Website</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
        </div>
      </header>

      {/* ============ Main ============ */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          {/* Search box */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-md flex items-center gap-2 mb-6"
          >
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Enter Certificate ID"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />
            <button
              type="submit"
              className="bg-[#046A38] hover:bg-[#035938] text-white px-5 py-2 rounded-lg text-sm font-medium shadow transition"
            >
              <i className="fa-solid fa-magnifying-glass mr-1"></i>
              Verify
            </button>
          </form>

          {/* Loading */}
          {loading && (
            <div className="text-center text-slate-500 text-sm py-6">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Fetching record...
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="w-full max-w-lg text-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
              <i className="fa-solid fa-circle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          {/* Result */}
          {data && !loading && !error && (
            <>
              {/* Status badge */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-[#d4f3e6] border border-[#a2e6cb] text-[#006038] font-semibold text-sm rounded-full shadow-sm mb-3">
                  <i className="fa-regular fa-circle-check text-base text-[#007a48]"></i>
                  <span>Valid Statement</span>
                </div>
                <p className="text-xs md:text-sm text-slate-600 font-normal">
                  The following details are confirmed and digitally generated.
                </p>
              </div>

              {/* Document Card */}
              <div className="bg-white w-full rounded-2xl shadow-xl border border-slate-200/80 p-6 md:p-10 mb-8">
                <h1 className="text-center font-bold text-slate-800 text-base md:text-lg tracking-wide uppercase mb-8 border-b-2 border-slate-800 inline-block pb-0.5 mx-auto w-fit block">
                  TO WHOM IT MAY CONCERN
                </h1>

                {/* Meta grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm mb-8">
                  <div className="space-y-3">
                    <InfoField
                      label="Account Holder Name"
                      value={data['Account Holder Name']}
                    />
                    <InfoField
                      label="Certificate ID"
                      value={data['Certificate ID']}
                    />
                  </div>
                  <div className="space-y-3">
                    <InfoField
                      label="Date"
                      value={data['Date']}
                      alignRight
                    />
                  </div>
                </div>

                {/* Accounts table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs md:text-sm text-left text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] md:text-xs text-slate-700 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-3 md:px-4 text-center border-r border-slate-200">
                          SL#
                        </th>
                        <th className="py-3 px-3 md:px-4 border-r border-slate-200">
                          A/C Number
                        </th>
                        <th className="py-3 px-3 md:px-4 border-r border-slate-200">
                          Open Date
                        </th>
                        <th className="py-3 px-3 md:px-4 border-r border-slate-200">
                          A/C Type
                        </th>
                        <th className="py-3 px-3 md:px-4 text-right border-r border-slate-200">
                          Balance (BDT)
                        </th>
                        <th className="py-3 px-3 md:px-4 text-right">
                          Balance (EUR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 md:px-4 text-center font-medium text-slate-600 border-r border-slate-200">
                          1
                        </td>
                        <td className="py-3.5 px-3 md:px-4 font-normal text-slate-800 border-r border-slate-200 whitespace-nowrap">
                          {data['Account Number'] || '—'}
                        </td>
                        <td className="py-3.5 px-3 md:px-4 font-normal text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {data['Open Date'] || '—'}
                        </td>
                        <td className="py-3.5 px-3 md:px-4 font-normal text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {data['Account Type'] || '—'}
                        </td>
                        <td className="py-3.5 px-3 md:px-4 text-right font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap">
                          {formatBDT(data['Balance BDT'])}
                        </td>
                        <td className="py-3.5 px-3 md:px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                          {formatEUR(data['Balance EUR'])}
                        </td>
                      </tr>

                      <tr className="bg-slate-50/50 font-bold border-t-2 border-slate-200">
                        <td
                          colSpan="4"
                          className="py-3 px-4 text-right font-bold text-slate-800 border-r border-slate-200"
                        >
                          Total
                        </td>
                        <td className="py-3 px-4 text-right text-[#006038] font-bold border-r border-slate-200 whitespace-nowrap">
                          {formatBDT(data['Balance BDT'])}
                        </td>
                        <td className="py-3 px-4 text-right text-[#006038] font-bold whitespace-nowrap">
                          {formatEUR(data['Balance EUR'])}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!data && !loading && !error && (
            <div className="text-center text-slate-500 text-sm py-10">
              <i className="fa-solid fa-file-circle-question text-4xl mb-3 block text-slate-400"></i>
              Scan a QR code or enter a Certificate ID above to verify.
            </div>
          )}
        </div>
      </main>

      {/* ============ Footer ============ */}
      <footer className="bg-white border-t border-slate-200/80 text-slate-600 py-6 px-4 md:px-12 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2">
            <FooterItem icon="fa-solid fa-phone" label="Helpline">
              {footerInfo.helpline}
            </FooterItem>
            <FooterItem icon="fa-solid fa-tty" label="PABX Number">
              {footerInfo.pabx}
            </FooterItem>
            <FooterItem icon="fa-solid fa-fax" label="Fax">
              {footerInfo.fax}
            </FooterItem>
          </div>
          <div className="space-y-2 md:text-left">
            <FooterItem icon="fa-solid fa-envelope" label="Mail" isLink>
              {footerInfo.email}
            </FooterItem>
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-location-dot text-emerald-700 w-4 text-center mt-0.5"></i>
              <span>
                <strong>Address:</strong> {footerInfo.address}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;