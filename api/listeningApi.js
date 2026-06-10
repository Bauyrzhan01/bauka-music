import { getApiBaseUrl } from '../constants/api';
import { API_OFFLINE_MESSAGE, parseApiJson } from './parseApiJson';

export async function sendListeningHeartbeat(payload) {
  const base = getApiBaseUrl();
  try {
    const response = await fetch(`${base}/api/listening/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await parseApiJson(response);
  } catch {
    // offline — ignore
  }
}

export async function fetchNowPlaying() {
  const base = getApiBaseUrl();
  try {
    const response = await fetch(`${base}/api/listening/now`);
    const data = await parseApiJson(response);
    return data.listeners ?? [];
  } catch {
    return [];
  }
}
