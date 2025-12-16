const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function safeWrite(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${filepath}`);
}

function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const xlsxPath = path.join(dataDir, 'Gen_AI_Dataset.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    console.error('Excel file not found at', xlsxPath);
    process.exit(1);
  }

  const workbook = xlsx.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows || rows.length === 0) {
    console.error('No rows found in the spreadsheet');
    process.exit(1);
  }

  // Write full JSON export
  const outJson = path.join(dataDir, 'gen_ai_dataset.json');
  safeWrite(outJson, rows);

  // Try to extract a sensible text column for unlabeled test queries
  const possibleKeys = ['text', 'query', 'utterance', 'transcript', 'sentence', 'prompt', 'content'];
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  let chosenKey = null;
  for (const k of possibleKeys) {
    const found = keys.find(key => key.toLowerCase() === k.toLowerCase());
    if (found) { chosenKey = found; break; }
  }

  if (!chosenKey) {
    // fallback to the first non-empty column
    chosenKey = keys.find(k => rows.some(r => String(r[k] || '').trim().length > 0));
  }

  if (!chosenKey) {
    console.warn('Could not find a suitable text column; creating empty unlabeled_test.json');
    safeWrite(path.join(dataDir, 'unlabeled_test.json'), []);
    return;
  }

  const queries = rows.map(r => String(r[chosenKey] || '').trim()).filter(s => s.length > 0);
  safeWrite(path.join(dataDir, 'unlabeled_test.json'), queries);

  console.log(`Detected text column: ${chosenKey} — extracted ${queries.length} queries`);
}

main();
