const XLSX = require('xlsx');

/**
 * Expected column headers (case-insensitive matching).
 * Maps normalized header names to output field names.
 */
const COLUMN_MAP = {
  'program': 'program',
  'year': 'year',
  'class code': 'class_code',
  'classcode': 'class_code',
  'section': 'section',
  'day': 'day',
  'start time': 'start_time',
  'starttime': 'start_time',
  'end time': 'end_time',
  'endtime': 'end_time',
  'subject': 'subject',
  'session type': 'session_type',
  'sessiontype': 'session_type',
  'room': 'room',
  'teacher': 'teacher',
};

/**
 * Extract building code from a room string.
 * For rooms like "B305", "NB201" → extracts the leading uppercase letters ("B", "NB").
 * For rooms like "Music Room" that don't start with a typical code → uses the full room name.
 */
function extractBuilding(room) {
  if (!room) return '';
  const match = room.match(/^([A-Z]+)\d/);
  if (match) {
    return match[1];
  }
  // Fallback: use the full room name as the building
  return room.trim();
}

/**
 * Parse an Excel file buffer and return cleaned timetable rows.
 * @param {Buffer} fileBuffer - The uploaded Excel file as a buffer.
 * @returns {Array<Object>} Array of cleaned row objects.
 */
function parseExcel(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw headers
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return [];
  }

  // Build a mapping from actual Excel headers to our field names
  const sampleRow = rawRows[0];
  const actualHeaders = Object.keys(sampleRow);
  const headerMapping = {};

  for (const header of actualHeaders) {
    const normalized = header.toLowerCase().trim().replace(/_/g, ' ');
    if (COLUMN_MAP[normalized]) {
      headerMapping[header] = COLUMN_MAP[normalized];
    }
  }

  const results = [];

  for (const row of rawRows) {
    const cleaned = {};

    for (const [excelHeader, fieldName] of Object.entries(headerMapping)) {
      let value = row[excelHeader];
      // Convert to string and trim
      cleaned[fieldName] = value != null ? String(value).trim() : '';
    }

    // Skip rows where room or day is empty
    if (!cleaned.room || !cleaned.day) {
      continue;
    }

    // Extract building from room
    cleaned.building = extractBuilding(cleaned.room);

    results.push(cleaned);
  }

  return results;
}

module.exports = { parseExcel, extractBuilding };
