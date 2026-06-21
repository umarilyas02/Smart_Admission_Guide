'use server';

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { syncUniversityData } from '@/lib/university-sync';

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
    return {
      success: false,
      output: '',
      error: 'CLOUDFLARE_WORKER_URL is not set in .env.local',
      steps: [{ label: 'Configuration', status: 'failed', detail: 'Missing worker URL' }],
    };
  }

  const steps = [
    { label: 'Fetch worker data', status: 'running', detail: workerUrl },
    { label: 'Write raw data', status: 'pending', detail: '' },
    { label: 'Clean scraped data', status: 'pending', detail: '' },
    { label: 'Sync database', status: 'pending', detail: '' },
  ];

  let rawData;
  try {
    const res = await fetch(workerUrl);
    if (!res.ok) {
      steps[0] = { ...steps[0], status: 'failed', detail: `HTTP ${res.status}` };
      return { success: false, output: '', error: `Cloudflare Worker returned HTTP ${res.status}`, steps };
    }
    rawData = await res.json();
    steps[0] = {
      ...steps[0],
      status: 'done',
      detail: `${rawData?.results?.length || 0} university payloads fetched`,
    };
    steps[1] = { ...steps[1], status: 'running', detail: 'Saving to data.json' };
  } catch (err) {
    steps[0] = { ...steps[0], status: 'failed', detail: err.message };
    return { success: false, output: '', error: `Could not reach Cloudflare Worker: ${err.message}`, steps };
  }

  const dataPath = path.join(process.cwd(), 'data.json');
  try {
    await writeFile(dataPath, JSON.stringify(rawData, null, 2), 'utf-8');
    steps[1] = { ...steps[1], status: 'done', detail: dataPath };
    steps[2] = { ...steps[2], status: 'running', detail: 'Running Python cleaner' };
  } catch (err) {
    steps[1] = { ...steps[1], status: 'failed', detail: err.message };
    return { success: false, output: '', error: `Failed to write data.json: ${err.message}`, steps };
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'auto_post_clean_data.py');
  const { code, stdout, stderr } = await runPython(scriptPath, {
    ...process.env,
    SKIP_POST: 'true',
  });

  if (code !== 0) {
    steps[2] = { ...steps[2], status: 'failed', detail: stderr.trim() || `Exit code ${code}` };
    return {
      success: false,
      output: stdout.trim(),
      error: stderr.trim() || `Python exited with code ${code}`,
      steps,
    };
  }
  steps[2] = { ...steps[2], status: 'done', detail: 'clean_data.json generated' };
  steps[3] = { ...steps[3], status: 'running', detail: 'Writing cleaned data to database' };

  const cleanPath = path.join(process.cwd(), 'clean_data.json');
  let cleaned;
  try {
    const cleanFile = await readFile(cleanPath, 'utf-8');
    cleaned = JSON.parse(cleanFile);
  } catch (err) {
    steps[3] = { ...steps[3], status: 'failed', detail: `Read failed: ${err.message}` };
    return {
      success: false,
      output: stdout.trim(),
      error: `Failed to read clean_data.json: ${err.message}`,
      steps,
    };
  }

  try {
    const synced = await syncUniversityData(cleaned.data || [], { replace: false });
    steps[3] = {
      ...steps[3],
      status: 'done',
      detail: `${synced.inserted_count} universities synced`,
    };

    return {
      success: true,
      output: stdout.trim(),
      error: '',
      sync: synced,
      steps,
    };
  } catch (err) {
    steps[3] = { ...steps[3], status: 'failed', detail: err.message };
    return {
      success: false,
      output: stdout.trim(),
      error: `Database sync failed: ${err.message}`,
      steps,
    };
  }
}
