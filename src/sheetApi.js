// ============================================================
// Google Sheets config
// ============================================================
const SHEET_A = {
  id: '1u-ae3CMIpvLpqBp79Ciey93KaKTbuEqZzKJrW50mcKU',
  name: 'Sheet1', // tab name for "Statement" type (22…)
};

const SHEET_B = {
  id: '16iGtkKwSca1MR84QNkC2vN2psv_vYeLiRLzDiaTD0Q8',
  name: 'Sheet1', // tab name for "Certificate" type (66…)
};

/**
 * Decide which sheet to use based on the certificate ID prefix.
 *   - IDs starting with "66" → Sheet B (Statement Summary style)
 *   - Everything else        → Sheet A (Certificate style)
 */
function pickSheet(certId) {
  const id = String(certId).trim();
  if (id.startsWith('66')) return SHEET_B;
  return SHEET_A;
}

/**
 * Fetch all rows from a public Google Sheet as objects.
 */
async function fetchSheetData(sheet) {
  const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheet.name
  )}`;

  const res = await fetch(url);
  const text = await res.text();

  // Response is JSONP-wrapped
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

  const cols = json.table.cols.map((c) => c.label || c.id);
  const rows = json.table.rows.map((r) => {
    const obj = {};
    cols.forEach((col, i) => {
      const cell = r.c && r.c[i];
      obj[col] = cell ? cell.v : '';
    });
    return obj;
  });

  return rows;
}

/**
 * Look up a single certificate by ID.
 * Returns the row object plus the detected "type" ("A" or "B").
 */
export async function fetchCertificateById(certId) {
  const id = String(certId).trim();
  const type = id.startsWith('66') ? 'B' : 'A';
  const sheet = pickSheet(id);
  const rows = await fetchSheetData(sheet);

  const row = rows.find(
    (r) => String(r['Certificate ID']).trim() === id
  );

  if (!row) return null;
  return { ...row, __type: type };
}