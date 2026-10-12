// Google Sheet config
const SHEET_ID = '1u-ae3CMIpvLpqBp79Ciey93KaKTbuEqZzKJrW50mcKU';
const SHEET_NAME = 'Sheet1'; // change if your tab has a different name

/**
 * Fetch all rows from the public Google Sheet as JSON.
 * Returns an array of objects keyed by the header row.
 */
export async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    SHEET_NAME
  )}`;

  const res = await fetch(url);
  const text = await res.text();

  // Response is wrapped as: google.visualization.Query.setResponse({...});
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
 * Fetch a single certificate by ID.
 */
export async function fetchCertificateById(id) {
  const rows = await fetchSheetData();
  return rows.find(
    (row) => String(row['Certificate ID']).trim() === String(id).trim()
  );
}