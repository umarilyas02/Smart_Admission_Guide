'use server';

import { cleanUniversityRows } from '@/lib/university-cleaner';
import { syncUniversityData } from '@/lib/university-sync';

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
    { label: 'Prepare payload', status: 'pending', detail: '' },
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
    steps[1] = { ...steps[1], status: 'done', detail: 'Raw payload kept in memory' };
    steps[2] = { ...steps[2], status: 'running', detail: 'Normalizing worker output in memory' };
  } catch (err) {
    steps[0] = { ...steps[0], status: 'failed', detail: err.message };
    return { success: false, output: '', error: `Could not reach Cloudflare Worker: ${err.message}`, steps };
  }

  let cleaned;
  try {
    cleaned = cleanUniversityRows(rawData);
    steps[2] = {
      ...steps[2],
      status: 'done',
      detail: `${cleaned?.data?.length || 0} cleaned university records ready`,
    };
    steps[3] = { ...steps[3], status: 'running', detail: 'Writing cleaned data to database' };
  } catch (err) {
    steps[2] = { ...steps[2], status: 'failed', detail: err.message };
    return {
      success: false,
      output: '',
      error: `Failed to clean scraped data: ${err.message}`,
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

    const cleanerSummary = cleaned.summary || {};
    const output = [
      `Processed ${cleanerSummary.total_items || 0} payloads`,
      `Saved ${cleanerSummary.saved || 0}`,
      `Programs extracted ${cleanerSummary.programs_extracted || 0}`,
      `Locations found ${cleanerSummary.locations_found || 0}`,
      `Fee links found ${cleanerSummary.fee_links_found || 0}`,
      `Dates undeclared ${cleanerSummary.undeclared || 0}`,
    ].join('\n');

    return {
      success: true,
      output,
      error: '',
      sync: {
        ...synced,
        cleaner: cleanerSummary,
      },
      steps,
    };
  } catch (err) {
    steps[3] = { ...steps[3], status: 'failed', detail: err.message };
    return {
      success: false,
      output: '',
      error: `Database sync failed: ${err.message}`,
      steps,
    };
  }
}
