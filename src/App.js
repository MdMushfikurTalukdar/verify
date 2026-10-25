import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchCertificateById } from './sheetApi';
import './App.css';

/* -------------------- Configuration -------------------- */

const WEBSITE_URL = 'https://verify-seven-liard.vercel.app';
const SESSION_TIMEOUT_MS = 30_000;

const footerInfo = {
  helpline: '+8809660616253, 16253',
  pabx: '+88 02223381614',
  fax: '880-2-9564009',
  email: 'info@bankbd.com',
  address:
    'Head Office, 26 Dilkusha Commercial Area, Dhaka 1000, Bangladesh',
};

/* -------------------- Format helpers -------------------- */

const formatNumber = (value) => {
  if (value === '' || value === null || value === undefined) return '—';

  const number = Number(value);
  if (Number.isNaN(number)) return value;

  return number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatBDT = (value) => {
  if (value === '' || value === null || value === undefined) return '—';

  const number = Number(value);
  if (Number.isNaN(number)) return value;

  return (
    '৳' +
    number.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const formatEUR = (value) => {
  if (value === '' || value === null || value === undefined) return '—';

  const number = Number(value);
  if (Number.isNaN(number)) return value;

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/* -------------------- Live date and time -------------------- */

function LiveGeneratedDate() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return now.toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/* -------------------- Security hook -------------------- */

function useSessionGuard(active) {
  const [sessionId] = useState(
    () => 'SES-' + Math.random().toString(36).slice(2, 20).toUpperCase()
  );

  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    if (!active) {
      setBlurred(false);
      return;
    }

    const onVisibility = () => setBlurred(document.hidden);
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onBlur);
    window.addEventListener('pageshow', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onBlur);
      window.removeEventListener('pageshow', onFocus);
    };
  }, [active]);

  return { sessionId, blurred, setBlurred };
}

/* -------------------- Error overlay -------------------- */

function ServerDownOverlay({ title, message }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center text-slate-200">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-red-400"></i>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {title || '503 — Service Temporarily Unavailable'}
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          {message ||
            'Our verification servers are currently unavailable. Please try again later.'}
        </p>

        <div className="text-xs text-slate-500 border-t border-slate-700 pt-4">
          <p>
            Error Code:{' '}
            <span className="font-mono">ERR_UPSTREAM_TIMEOUT</span>
          </p>
          <p className="mt-1">
            Reference ID:{' '}
            <span className="font-mono">
              {Math.random().toString(36).slice(2, 12).toUpperCase()}
            </span>
          </p>
          <p className="mt-3">
            Status: <span className="text-red-400">● Unavailable</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Layout A — Certificate / Table (Flag = 1)
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
              {data['id'] ?? '—'}
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
              <th className="py-3 px-3 border border-slate-200 text-center">
                SL#
              </th>
              <th className="py-3 px-3 border border-slate-200 text-center">
                A/C NUMBER
              </th>
              <th className="py-3 px-3 border border-slate-200 text-center">
                OPEN DATE
              </th>
              <th className="py-3 px-3 border border-slate-200 text-center">
                A/C TYPE
              </th>
              <th className="py-3 px-3 border border-slate-200 text-center">
                BALANCE (BDT)
              </th>
              <th className="py-3 px-3 border border-slate-200 text-center">
                BALANCE (EUR)
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            <tr>
              <td className="py-3 px-3 text-center border border-slate-200 text-slate-600">
                1
              </td>
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
              <td
                colSpan="4"
                className="py-3 px-3 text-right font-bold text-slate-800 border border-slate-200"
              >
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
   Layout B — Statement Summary (Flag = 2)
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
            {data['id'] ?? '—'}
          </div>
        </div>
      </div>

      <hr className="my-6 border-slate-200" />

      <div className="text-slate-700 text-xs md:text-sm">
        <span className="font-bold text-slate-500 uppercase tracking-wide text-[11px]">
          Statement Generated Date:
        </span>{' '}
        <span className="font-semibold text-slate-900">
          <LiveGeneratedDate />
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Layout C — PDF-style statement (Flag = 3)
   ============================================================ */

function Flag3Layout({ data }) {
  const primary = {
    accountNo: data['Account No'] || '—',
    accountType: data['Account Type'] || '—',
    accountName: data['Account Name'] || '—',
    openingBalance: data['Opening Balance'] ?? '',
    closingBalance: data['Closing Balance'] ?? '',
    statementPeriod: data['Statement Period'] || '—',
    certificateId: data['id'] ?? '—',
    generatedDate: null,
  };

  const secondary = {
    accountNo: data['Account No 2'] || primary.accountNo,
    accountType: data['Account Type 2'] || primary.accountType,
    accountName: data['Account Name 2'] || primary.accountName,
    openingBalance: data['Opening Balance 2'] ?? primary.openingBalance,
    closingBalance: data['Closing Balance 2'] ?? primary.closingBalance,
    statementPeriod: data['Statement Period 2'] || primary.statementPeriod,
    certificateId: data['id'] ?? primary.certificateId,
  };

  const money = (value) => {
    if (value === '' || value === null || value === undefined) return '—';

    const cleaned = String(value).replace(/[৳,: ]/g, '');
    const number = Number(cleaned);

    if (Number.isNaN(number)) return String(value);

    return (
      '৳' +
      number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const fields = [
    ['ACCOUNT NO:', 'accountNo'],
    ['ACCOUNT TYPE:', 'accountType'],
    ['ACCOUNT NAME:', 'accountName'],
    ['OPENING BALANCE:', 'openingBalance'],
    ['CLOSING BALANCE:', 'closingBalance'],
    ['STATEMENT PERIOD:', 'statementPeriod'],
    ['CERTIFICATE ID:', 'certificateId'],
  ];

  const SummaryFields = ({ record, compact = false }) => (
    <div className={`statement-fields ${compact ? 'secondary-fields' : ''}`}>
      {fields.map(([label, key]) => {
        const isBalance =
          key === 'openingBalance' || key === 'closingBalance';

        return (
          <div className="statement-field" key={key}>
            <div className="statement-label">{label}</div>
            <div
              className={`statement-value ${
                isBalance ? 'statement-balance' : ''
              }`}
            >
              {isBalance ? money(record[key]) : record[key]}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="pdf-document">
      {/* Original statement hero section is intentionally hidden. */}

      <section className="secondary-summary">
        <h2 className="secondary-title">STATEMENT SUMMARY</h2>

        <SummaryFields record={secondary} compact />

        <div className="secondary-generated">
          <strong>STATEMENT GENERATED DATE:</strong>{' '}
          <LiveGeneratedDate />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   Main App
   ============================================================ */

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const timerRef = useRef(null);

  const resultVisible = Boolean(data) && !loading && !error && !expired;

  const {
    sessionId,
    blurred: sessionBlurred,
    setBlurred: setSessionBlurred,
  } = useSessionGuard(resultVisible);

  const contentBlurred = blurred || sessionBlurred;
  const isPdfMode = data?.__type === '3';

  useEffect(() => {
    if (!resultVisible || contentBlurred) return;

    timerRef.current = setTimeout(() => {
      setExpired(true);
      setData(null);
    }, SESSION_TIMEOUT_MS);

    return () => clearTimeout(timerRef.current);
  }, [resultVisible, contentBlurred]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl =
      params.get('id') || params.get('certificate') || params.get('cert');

    if (idFromUrl) {
      loadCertificate(idFromUrl);
    }

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCertificate = async (id) => {
    setError('');
    setData(null);
    setExpired(false);
    setBlurred(false);
    setSessionBlurred(false);
    setLoading(true);

    try {
      const row = await fetchCertificateById(id);

      if (!row) {
        setError(`No record found for Certificate ID: ${id}`);
      } else {
        setData(row);
      }
    } catch (err) {
      console.error('Certificate lookup failed:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitWebsite = () => {
    setBlurred(true);
    setSessionBlurred(true);

    setTimeout(() => {
      window.open(WEBSITE_URL, '_blank', 'noopener,noreferrer');
    }, 100);
  };

  const badgeLabel =
    data?.__type === '3' || data?.__type === '2'
      ? 'Valid Statement'
      : 'Valid Certificate';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between text-slate-800 antialiased ${
        isPdfMode ? 'bg-white' : 'bg-[#f1f6f3] select-none'
      }`}
    >
      {!isPdfMode && (
        <header className="bg-[#0d6b41] text-white px-4 md:px-8 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center gap-3 text-base md:text-lg font-semibold"
            >
              <i className="fa-solid fa-file-circle-check text-xl text-emerald-200"></i>
              <span>Document Verifier</span>
            </Link>

            <button
              type="button"
              onClick={handleVisitWebsite}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium transition flex items-center gap-2"
            >
              <span>Visit Website</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </button>
          </div>
        </header>
      )}

      <main
        className={
          isPdfMode
            ? 'flex-grow p-0'
            : 'flex-grow flex flex-col items-center px-4 py-8 md:py-12'
        }
      >
        {isPdfMode ? (
          <div className="w-full mx-auto">
            {loading && (
              <div className="text-center text-slate-500 text-sm py-6">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Fetching record...
              </div>
            )}

            {error && !loading && (
              <div className="w-full text-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {error}
              </div>
            )}

            {resultVisible && (
              <div
                className={`relative w-full transition-all duration-200 ${
                  contentBlurred
                    ? 'blur-xl pointer-events-none select-none'
                    : ''
                }`}
              >
                <Flag3Layout data={data} />

                {contentBlurred && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 rounded-lg">
                    <div className="text-white text-center px-4">
                      <i className="fa-solid fa-eye-slash text-3xl mb-2"></i>
                      <p className="text-sm font-semibold">
                        Content hidden for security
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        Return to this tab to view
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!data && !loading && !error && !expired && (
              <div className="text-center text-slate-500 text-sm py-10">
                <i className="fa-solid fa-file-circle-question text-4xl mb-3 block text-slate-400"></i>
                Scan a QR code or open a verification link to verify.
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            {loading && (
              <div className="text-center text-slate-500 text-sm py-6">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Fetching record...
              </div>
            )}

            {error && !loading && (
              <div className="w-full max-w-lg text-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {error}
              </div>
            )}

            {resultVisible && (
              <>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#d1f2e2] border border-[#a3e2c3] text-[#0b6b40] font-semibold text-sm rounded-full mb-3">
                    <i className="fa-solid fa-check text-base"></i>
                    <span>{badgeLabel}</span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-600 text-center">
                    The following details are confirmed and digitally
                    generated by Pubali Bank PLC.
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Session {sessionId} • auto-hides in 30s
                  </p>
                </div>

                <div
                  className={`relative w-full transition-all duration-200 ${
                    contentBlurred
                      ? 'blur-xl pointer-events-none select-none'
                      : ''
                  }`}
                >
                  {data.__type === '3' ? (
                    <Flag3Layout data={data} />
                  ) : data.__type === '2' ? (
                    <StatementLayout data={data} />
                  ) : (
                    <CertificateLayout data={data} />
                  )}

                  {contentBlurred && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 rounded-xl">
                      <div className="text-white text-center px-4">
                        <i className="fa-solid fa-eye-slash text-3xl mb-2"></i>
                        <p className="text-sm font-semibold">
                          Content hidden for security
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          Return to this tab to view
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!data && !loading && !error && !expired && (
              <div className="text-center text-slate-500 text-sm py-10">
                <i className="fa-solid fa-file-circle-question text-4xl mb-3 block text-slate-400"></i>
                Scan a QR code or open a verification link to verify.
              </div>
            )}
          </div>
        )}
      </main>

      {!isPdfMode && (
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
      )}

      {expired && (
        <ServerDownOverlay
          title="Verification Session Expired"
          message="Your verification session has expired. Please open the verification link again."
        />
      )}
    </div>
  );
}

export default App;