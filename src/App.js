import React, { useState, useEffect, useRef } from 'react';
import { fetchCertificateById } from './sheetApi';
import './App.css';

/* -------------------- Config -------------------- */
const WEBSITE_URL = 'https://verify-seven-liard.vercel.app';

const footerInfo = {
  helpline: '+8809660616253, 16253',
  pabx: '+88 02223381614',
  fax: '880-2-9564009',
  email: 'info@bankbd.com',
  address:
    'Head Office, 26 Dilkusha Commercial Area, Dhaka 1000, Bangladesh',
};

const SESSION_TIMEOUT_MS = 10_000; // hide the data after 10 seconds

/* -------------------- Format helpers -------------------- */
const formatNumber = (n) => {
  if (n === '' || n === null || n === undefined) return '—';
  const num = Number(n);
  if (isNaN(num)) return n;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};
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

/* ============================================================
   Security hook — returns a session ID and deters screenshots
   ============================================================ */
function useSessionGuard(active) {
  const [sessionId] = useState(
    () => 'SES-' + Math.random().toString(36).slice(2, 10).toUpperCase()
  );
  const [blurred, setBlurred] = useState(false);

  // 1. Blur page when tab loses focus (deters some capture tools)
  useEffect(() => {
    if (!active) return;

    const onVisibility = () => setBlurred(document.hidden);
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [active]);

  // 2. Disable right-click, selection, copy, print, and shortcuts
  useEffect(() => {
    if (!active) return;

    const blockContext = (e) => e.preventDefault();
    const blockSelect = (e) => e.preventDefault();
    const blockCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData('text/plain', '');
    };
    const blockKey = (e) => {
      const k = e.key.toUpperCase();
      // PrintScreen
      if (k === 'PRINTSCREEN') e.preventDefault();
      // Ctrl/Cmd + P (print), S (save), C (copy), Shift+S (screenshot on some OS)
      if ((e.ctrlKey || e.metaKey) && ['P', 'S', 'C'].includes(k)) {
        e.preventDefault();
      }
      // F12, Ctrl+Shift+I / J / C (DevTools)
      if (
        k === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(k))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('selectstart', blockSelect);
    document.addEventListener('copy', blockCopy);
    document.addEventListener('keydown', blockKey);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('selectstart', blockSelect);
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('keydown', blockKey);
    };
  }, [active]);

  return { sessionId, blurred };
}

/* ============================================================
   Watermark overlay — identifies any leaked screenshot
   ============================================================ */
function Watermark({ sessionId }) {
  const [ip, setIp] = useState('detecting…');

  useEffect(() => {
    // Public IP lookup (optional). Remove if you don't want an external call.
    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d) => setIp(d.ip))
      .catch(() => setIp('unknown'));
  }, []);

  const now = new Date().toLocaleString();
  const text = `${ip} • ${sessionId} • ${now}`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-wrap content-center justify-center overflow-hidden opacity-[0.08] select-none"
      aria-hidden="true"
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="text-[10px] md:text-xs font-bold text-slate-900 whitespace-nowrap rotate-[-25deg] px-6 py-4"
        >
          {text}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   Server-down overlay — shown after session timeout
   ============================================================ */
function ServerDownOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center text-slate-200">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-red-400"></i>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          503 — Service Temporarily Unavailable
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Our verification servers are currently under maintenance. Please try
          again later.
        </p>
        <div className="text-xs text-slate-500 border-t border-slate-700 pt-4">
          <p>Error Code: <span className="font-mono">ERR_UPSTREAM_TIMEOUT</span></p>
          <p className="mt-1">
            Reference ID:{' '}
            <span className="font-mono">
              {Math.random().toString(36).slice(2, 12).toUpperCase()}
            </span>
          </p>
          <p className="mt-3">Status: <span className="text-red-400">● Offline</span></p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Layout A — Certificate / Table (IDs starting with 22…)
   ============================================================ */
function CertificateLayout({ data }) {
  return (
    <div className="bg-white w-full rounded-xl shadow-lg border border-slate-200/70 p-6 md:p-10 mb-8">
      <h2 className="text-center font-bold text-base md:text-lg text-slate-900 underline tracking-wide mb-8">
        TO WHOM IT MAY CONCERN
      </h2>

      <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-6 text-xs md:text-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
              Account Holder Name:
            </label>
            <div className="font-bold text-slate-900 text-sm md:text-base">
              {data['Account Holder Name'] || '—'}
            </div>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
              Certificate ID:
            </label>
            <div className="font-bold text-slate-900 text-sm md:text-base">
              {data['Certificate ID'] || '—'}
            </div>
          </div>
        </div>
        <div className="md:text-right">
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Date:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base">
            {data['Date'] || '—'}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-[11px] md:text-xs text-left text-slate-700 border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] md:text-[11px] text-slate-700 uppercase font-bold tracking-wide">
            <tr>
              <th className="py-3 px-3 border border-slate-200 text-center">SL#</th>
              <th className="py-3 px-3 border border-slate-200 text-center">A/C NUMBER</th>
              <th className="py-3 px-3 border border-slate-200 text-center">OPEN DATE</th>
              <th className="py-3 px-3 border border-slate-200 text-center">A/C TYPE</th>
              <th className="py-3 px-3 border border-slate-200 text-center">BALANCE (BDT)</th>
              <th className="py-3 px-3 border border-slate-200 text-center">BALANCE (EUR)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="py-3 px-3 text-center border border-slate-200 text-slate-600">1</td>
              <td className="py-3 px-3 border border-slate-200 text-slate-800 whitespace-nowrap">
                {data['Account Number'] || '—'}
              </td>
              <td className="py-3 px-3 border border-slate-200 text-slate-700 whitespace-nowrap">
                {data['Open Date'] || '—'}
              </td>
              <td className="py-3 px-3 border border-slate-200 text-slate-700 whitespace-nowrap">
                {data['Account Type'] || '—'}
              </td>
              <td className="py-3 px-3 border border-slate-200 text-right font-bold text-slate-800 whitespace-nowrap">
                {formatBDT(data['Balance BDT'])}
              </td>
              <td className="py-3 px-3 border border-slate-200 text-right font-bold text-slate-800 whitespace-nowrap">
                {formatEUR(data['Balance EUR'])}
              </td>
            </tr>
            <tr className="bg-slate-50/60">
              <td colSpan="4" className="py-3 px-3 text-right font-bold text-slate-800 border border-slate-200">
                Total
              </td>
              <td className="py-3 px-3 text-right font-bold text-[#0d6b41] border border-slate-200 whitespace-nowrap">
                {formatBDT(data['Balance BDT'])}
              </td>
              <td className="py-3 px-3 text-right font-bold text-[#0d6b41] border border-slate-200 whitespace-nowrap">
                {formatEUR(data['Balance EUR'])}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   Layout B — Statement Summary (IDs starting with 66…)
   ============================================================ */
function StatementLayout({ data }) {
  return (
    <div className="bg-white w-full rounded-xl shadow-lg border border-slate-200/70 p-6 md:p-10 mb-8">
      <h2 className="text-center font-bold text-lg md:text-2xl text-slate-900 mb-8">
        Statement Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-xs md:text-sm">
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Account No:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base">
            {data['Account No'] || '—'}
          </div>
        </div>
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Account Type:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base uppercase">
            {data['Account Type'] || '—'}
          </div>
        </div>
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Account Name:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base uppercase">
            {data['Account Name'] || '—'}
          </div>
        </div>
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Opening Balance:
          </label>
          <div className="font-bold text-[#0d6b41] text-sm md:text-base">
            {'৳' + formatNumber(data['Opening Balance'])}
          </div>
        </div>
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Closing Balance:
          </label>
          <div className="font-bold text-[#0d6b41] text-sm md:text-base">
            {'৳' + formatNumber(data['Closing Balance'])}
          </div>
        </div>
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Statement Period:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base">
            {data['Statement Period'] || '—'}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
            Certificate ID:
          </label>
          <div className="font-bold text-slate-900 text-sm md:text-base">
            {data['Certificate ID'] || '—'}
          </div>
        </div>
      </div>

      <hr className="my-6 border-slate-200" />

      <div className="text-slate-700 text-xs md:text-sm">
        <span className="font-bold text-slate-500 uppercase tracking-wide text-[11px]">
          Statement Generated Date:
        </span>{' '}
        <span className="font-semibold text-slate-900">
          {data['Statement Generated Date'] || '—'}
        </span>
      </div>
    </div>
  );
}

/* -------------------- Main App -------------------- */
function App() {
  const [certId, setCertId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  const resultVisible = Boolean(data) && !loading && !error && !expired;
  const { sessionId, blurred } = useSessionGuard(resultVisible);

  // Start a 10-second timer whenever data is displayed
  useEffect(() => {
    if (!resultVisible) return;

    timerRef.current = setTimeout(() => {
      setExpired(true);
      setData(null);
    }, SESSION_TIMEOUT_MS);

    return () => clearTimeout(timerRef.current);
  }, [resultVisible]);

  // Load ?id= on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl =
      params.get('id') || params.get('certificate') || params.get('cert');
    if (idFromUrl) {
      setCertId(idFromUrl);
      loadCertificate(idFromUrl);
    }
  }, []);

  const loadCertificate = async (id) => {
    setLoading(true);
    setError('');
    setData(null);
    setExpired(false);
    try {
      const row = await fetchCertificateById(id);
      if (!row) setError(`No record found for Certificate ID: ${id}`);
      else setData(row);
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

  /* Never render the app body if session expired */
  if (expired) return <ServerDownOverlay />;

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-800 antialiased bg-[#f1f6f3] select-none">
      {/* ============ Header ============ */}
      <header className="bg-[#0d6b41] text-white px-4 md:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 text-base md:text-lg font-semibold">
            <i className="fa-solid fa-file-circle-check text-xl text-emerald-200"></i>
            <span>Document Verifier</span>
          </div>

          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium transition flex items-center gap-2"
          >
            <span>Visit Website</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
        </div>
      </header>

      {/* ============ Main ============ */}
      <main className="flex-grow flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
          {/* Search */}
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
              className="bg-[#0d6b41] hover:bg-[#095433] text-white px-5 py-2 rounded-lg text-sm font-medium shadow transition"
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
          {resultVisible && (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#d1f2e2] border border-[#a3e2c3] text-[#0b6b40] font-semibold text-sm rounded-full mb-3">
                  <i className="fa-solid fa-check text-base"></i>
                  <span>Valid Statement</span>
                </div>
                <p className="text-xs md:text-sm text-slate-600 text-center">
                  The following details are confirmed and digitally generated.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Session {sessionId} • auto-hides in 10s
                </p>
              </div>

              {/* Blur wrapper — hides content when tab loses focus */}
              <div
                className={`relative w-full transition-all duration-200 ${
                  blurred ? 'blur-xl pointer-events-none' : ''
                }`}
              >
                {/* Watermark overlay */}
                <Watermark sessionId={sessionId} />

                {data.__type === 'B' ? (
                  <StatementLayout data={data} />
                ) : (
                  <CertificateLayout data={data} />
                )}
              </div>
            </>
          )}

          {/* Empty state */}
          {!data && !loading && !error && !expired && (
            <div className="text-center text-slate-500 text-sm py-10">
              <i className="fa-solid fa-file-circle-question text-4xl mb-3 block text-slate-400"></i>
              Scan a QR code or enter a Certificate ID above to verify.
            </div>
          )}
        </div>
      </main>

      {/* ============ Footer ============ */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 md:px-10 text-[11px] md:text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-emerald-700 w-4 text-center"></i>
              <span>
                <strong>Helpline:</strong> {footerInfo.helpline}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-tty text-emerald-700 w-4 text-center"></i>
              <span>
                <strong>PABX Number:</strong> {footerInfo.pabx}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-fax text-emerald-700 w-4 text-center"></i>
              <span>
                <strong>Fax:</strong> {footerInfo.fax}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-envelope text-emerald-700 w-4 text-center"></i>
              <span>
                <strong>Mail:</strong>{' '}
                <a
                  href={`mailto:${footerInfo.email}`}
                  className="hover:underline text-slate-700"
                >
                  {footerInfo.email}
                </a>
              </span>
            </div>
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