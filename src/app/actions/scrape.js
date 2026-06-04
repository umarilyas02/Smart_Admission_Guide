'use server';

import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

function getPythonExe() {
  const winVenv = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const unixVenv = path.join(process.cwd(), '.venv', 'bin', 'python');
  if (existsSync(winVenv)) return winVenv;
  if (existsSync(unixVenv)) return unixVenv;
  return 'python';
}

function runPython(scriptPath, env) {
  return new Promise((resolve) => {
    const proc = spawn(getPythonExe(), [scriptPath], { cwd: process.cwd(), env });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ code, stdout, stderr }));
    proc.on('error', (err) => resolve({ code: -1, stdout: '', stderr: err.message }));
  });
}

export async function runScrape() {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
  if (!workerUrl) {
    return { success: false, output: '', error: 'CLOUDFLARE_WORKER_URL is not set in .env.local' };
  }

  // Step 1: Fetch raw scraped data from Cloudflare Worker
  let rawData;
  try {
    const res = await fetch(workerUrl);
    if (!res.ok) {
      return { success: false, output: '', error: `Cloudflare Worker returned HTTP ${res.status}` };
    }
    rawData = await res.json();
  } catch (err) {
    return { success: false, output: '', error: `Could not reach Cloudflare Worker: ${err.message}` };
  }

  // Step 2: Write raw data to data.json (Python script reads this file)
  const dataPath = path.join(process.cwd(), 'data.json');
  try {
    await writeFile(dataPath, JSON.stringify(rawData, null, 2), 'utf-8');
  } catch (err) {
    return { success: false, output: '', error: `Failed to write data.json: ${err.message}` };
  }

  // Step 3: Run scripts/auto_post_clean_data.py
  const scriptPath = path.join(process.cwd(), 'scripts', 'auto_post_clean_data.py');
  // NEXT_PUBLIC_APP_URL → VERCEL_URL (auto-set by Vercel in production) → localhost
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const targetUrl = `${appUrl}/api/universities`;

  const { code, stdout, stderr } = await runPython(scriptPath, {
    ...process.env,
    TARGET_URL: targetUrl,
    REPLACE: 'true',
  });

  const success = code === 0;
  return {
    success,
    output: stdout.trim(),
    error: success ? '' : (stderr.trim() || `Python exited with code ${code}`),
  };
}
