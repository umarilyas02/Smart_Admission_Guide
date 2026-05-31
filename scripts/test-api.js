#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  const baseUrl = process.env.TARGET_URL || 'http://localhost:3000/api/universities';
  const filePath = path.resolve(__dirname, '..', 'clean_data.json');

  if (!fs.existsSync(filePath)) {
    console.error('clean_data.json not found at', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const body = JSON.stringify({ replace: true, data: JSON.parse(raw).data || [] });

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
    console.log('\n=== POSTING clean_data.json ===\n');
    const postRes = await fetchFn(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const postText = await postRes.text();
    console.log('POST Status:', postRes.status);
    try {
      const postData = JSON.parse(postText);
      console.log('POST Response:', JSON.stringify(postData, null, 2));
    } catch {
      console.log('POST Response (text):', postText.substring(0, 500));
    }

    console.log('\n=== FETCHING all universities from DB ===\n');
    const getRes = await fetchFn(baseUrl);
    const getText = await getRes.text();
    console.log('GET Status:', getRes.status);
    try {
      const getData = JSON.parse(getText);
      console.log('GET Response:', JSON.stringify(getData, null, 2));
    } catch {
      console.log('GET Response (text):', getText.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
