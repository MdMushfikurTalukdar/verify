// ============================================================
// Google Sheets config — three sheets, flag-based routing
// ============================================================

// Original Sheet A — Certificate / Table layout (flag = 1)
const SHEET_A = {
  id: '1u-ae3CMIpvLpqBp79Ciey93KaKTbuEqZzKJrW50mcKU',
  name: 'Sheet1',
};

// Original Sheet B — Statement Summary layout (flag = 2)
const SHEET_B = {
  id: '16iGtkKwSca1MR84QNkC2vN2psv_vYeLiRLzDiaTD0Q8',
  name: 'Sheet1',
};

// NEW sheet — PDF-style Statement Summary (flag = 3)
const SHEET_C = {
  id: '1eiNkhAuy7M4L4gO-F5MH_I14fNDlHie4VEL2olFmUUM',
  name: 'Sheet1', // Change if your tab is not named "Sheet1"
};

/**
 * Fetch all rows from a published Google Sheet as objects.
 */
async function fetchSheetData(sheet) {
  const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheet.name
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  }
  const text = await res.text();

  if (text.indexOf('{') === -1) {
    throw new Error(
      'Sheet is not published to the web. Go to File → Share → Publish to web.'
    );
  }

  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Unexpected sheet response — is the tab published?');
  }
  const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

  const cols = json.table.cols.map((c) => c.label || c.id);
  const rows = json.table.rows.map((r) => {
    const obj = {};
    cols.forEach((col, i) => {
      const cell = r.c && r.c[i];
      obj[col] = cell ? (cell.f ?? cell.v ?? '') : '';
    });
    return obj;
  });

  return rows;
}

/**
 * Fetch all rows from ALL three sheets in parallel.
 */
async function fetchAllSheets() {
  const [rowsA, rowsB, rowsC] = await Promise.all([
    fetchSheetData(SHEET_A).catch((e) => {
      console.error('Sheet A fetch failed:', e);
      return [];
    }),
    fetchSheetData(SHEET_B).catch((e) => {
      console.error('Sheet B fetch failed:', e);
      return [];
    }),
    fetchSheetData(SHEET_C).catch((e) => {
      console.error('Sheet C fetch failed:', e);
      return [];
    }),
  ]);
  return { rowsA, rowsB, rowsC };
}

/**
 * Read the "Flag" column from a row (case-insensitive).
 */
function readFlag(row) {
  const key = Object.keys(row).find(
    (k) => k.trim().toLowerCase() === 'flag'
  );
  if (!key) return 0;
  const n = parseInt(String(row[key]).trim(), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Look up a single certificate by ID across ALL three sheets.
 */
export async function fetchCertificateById(certId) {
  const id = String(certId).trim();
  const { rowsA, rowsB, rowsC } = await fetchAllSheets();

  // Search Sheet A → B → C in order
  let row = rowsA.find((r) => String(r['Certificate ID']).trim() === id);
  let source = 'A';

  if (!row) {
    row = rowsB.find((r) => String(r['Certificate ID']).trim() === id);
    source = 'B';
  }

  if (!row) {
    row = rowsC.find((r) => String(r['Certificate ID']).trim() === id);
    source = 'C';
  }

  if (!row) return null;

  let flag = readFlag(row);
  if (flag === 0) {
    flag = id.startsWith('66') ? 2 : 1;
  }

  let type = '1';
  if (flag === 2) type = '2';
  else if (flag === 3) type = '3';

  return { ...row, __type: type, __flag: flag, __source: source };
}