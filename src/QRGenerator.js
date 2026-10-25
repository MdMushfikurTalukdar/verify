
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRGenerator() {
  const [url, setUrl] = useState(
    'https://www.verifypubalibankbd.online/?id='
  );

  const [size, setSize] = useState(320);
  const [ecLevel, setEcLevel] = useState('M');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  const normalizeUrl = (raw) => {
    const trimmed = raw.trim();

    if (!trimmed) return '';

    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }

    return trimmed;
  };

  const finalUrl = normalizeUrl(url);

  useEffect(() => {
    if (!finalUrl) return;

    let cancelled = false;

    const render = async () => {
      try {
        setError('');

        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, finalUrl, {
            width: size,
            margin: 2,
            errorCorrectionLevel: ecLevel,
            color: {
              dark: darkColor,
              light: lightColor,
            },
          });
        }

        const svgString = await QRCode.toString(finalUrl, {
          type: 'svg',
          width: size,
          margin: 2,
          errorCorrectionLevel: ecLevel,
          color: {
            dark: darkColor,
            light: lightColor,
          },
        });

        if (!cancelled && svgRef.current) {
          svgRef.current.innerHTML = svgString;

          const svgEl = svgRef.current.querySelector('svg');

          if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', 'auto');
          }
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError('Failed to generate QR code. Check the URL.');
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [finalUrl, size, ecLevel, darkColor, lightColor]);

  const downloadPNG = () => {
    if (!canvasRef.current || !finalUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const downloadSVG = () => {
    if (!svgRef.current || !finalUrl) return;

    const svgEl = svgRef.current.querySelector('svg');

    if (!svgEl) return;

    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `qr-${Date.now()}.svg`;
    link.href = blobUrl;
    link.click();

    URL.revokeObjectURL(blobUrl);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);

      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Unable to copy URL. Please copy it manually.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f6f3] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d6b41] text-white px-4 md:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a
            href="/"
            className="flex items-center gap-3 text-base md:text-lg font-semibold"
          >
            <i className="fa-solid fa-qrcode text-xl text-emerald-200"></i>
            <span>QR Code Generator</span>
          </a>

          <a
            href="/"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium transition flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
            <span>Back to Verifier</span>
          </a>
        </div>
      </header>

      <main className="flex-grow">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 py-8 md:py-12">

          {/* Left: Form */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/70 p-6 md:p-8">
            <h2 className="text-slate-900 font-bold text-lg mb-6">
              Enter URL
            </h2>

            <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
              Website Address
            </label>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.verifypubalibankbd.online/?id="
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white mb-4"
            />

            <p className="text-[11px] text-slate-400 mb-6">
              Enter the ID after the equals sign. The QR code updates
              automatically as you edit the URL.
            </p>

            {/* QR Size */}
            <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
              Size: {size}px
            </label>

            <input
              type="range"
              min="160"
              max="800"
              step="20"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full mb-6 accent-emerald-700"
            />

            {/* Error Correction */}
            <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
              Error Correction
            </label>

            <div className="flex gap-2 mb-6">
              {['L', 'M', 'Q', 'H'].map((lv) => (
                <button
                  key={lv}
                  onClick={() => setEcLevel(lv)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    ecLevel === lv
                      ? 'bg-[#0d6b41] text-white border-[#0d6b41]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>

            {/* Colours */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
                  Foreground
                </label>

                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
                  Background
                </label>

                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer bg-white"
                />
              </div>
            </div>

            {/* Download and Clear */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadPNG}
                disabled={!finalUrl}
                className="flex-1 min-w-[140px] bg-[#0d6b41] hover:bg-[#095433] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i> PNG
              </button>

              <button
                onClick={downloadSVG}
                disabled={!finalUrl}
                className="flex-1 min-w-[140px] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-file-code"></i> SVG
              </button>

              <button
                onClick={() => setUrl('')}
                className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/70 p-6 md:p-8 flex flex-col items-center">
            <h2 className="text-slate-900 font-bold text-lg mb-6 self-start">
              Preview
            </h2>

            {!finalUrl && (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 text-sm py-16">
                <i className="fa-solid fa-qrcode text-5xl mb-3"></i>
                <p>Enter a URL to see the QR code</p>
              </div>
            )}

            {finalUrl && (
              <>
                <div
                  className="rounded-xl border border-slate-200 p-3 bg-white shadow-sm"
                  style={{ maxWidth: 380, width: '100%' }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto block"
                    style={{ imageRendering: 'pixelated' }}
                  />

                  <div ref={svgRef} style={{ display: 'none' }} />
                </div>

                <div className="w-full mt-6">
                  <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wide mb-1">
                    Encoded URL
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={finalUrl}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-50 text-black truncate"
                    />

                    <button
                      onClick={copyUrl}
                      className="bg-[#0d6b41] hover:bg-[#095433] text-white px-3 py-2 rounded-lg text-xs font-semibold transition"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="w-full mt-4 text-[11px] text-slate-500 border-t border-slate-200 pt-4">
                  <p>
                    <i className="fa-solid fa-infinity text-emerald-700 mr-1"></i>
                    This QR code has <strong>no expiry</strong> — the code
                    itself does not expire, but the destination website
                    must remain available.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="w-full mt-4 text-center bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                <i className="fa-solid fa-circle-exclamation mr-1"></i>
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
