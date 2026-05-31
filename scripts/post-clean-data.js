const fs = require('fs');
const path = require('path');

async function main() {
  const file = path.resolve(__dirname, '..', 'clean_data.json');
  if (!fs.existsSync(file)) {
    console.error('clean_data.json not found at', file);
    process.exit(1);
  }
  const raw = fs.readFileSync(file, 'utf8');
  const body = JSON.stringify({ replace: true, data: JSON.parse(raw).data || [] });
  const url = process.env.TARGET_URL || 'http://localhost:3000/api/universities';

  // Use global fetch when available (Node 18+), otherwise try node-fetch
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      console.error('Fetch API not available. Run on Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }

  try {
    const res = await fetchFn(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const text = await res.text();
    console.log('Status:', res.status);
    try { console.log('Response:', JSON.parse(text)); } catch { console.log('Response text:', text); }
  } catch (err) {
    console.error('Request error:', err.message || err);
    process.exit(1);
  }
}

main();
