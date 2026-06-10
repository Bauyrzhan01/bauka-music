import { getApiBaseUrl } from '../constants/api';
import { resolveAuthorAvatarUrl } from '../utils/resolveServerMediaUrl';

const API_OFFLINE_MESSAGE =
  'API-сервер не запущен. Остановите Expo и запустите: npm start';

function formatApiError(response, text) {
  if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
    return `${API_OFFLINE_MESSAGE}\n(маршрут ${response.url} недоступен — нужен npm start, не только expo start)`;
  }
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
    return API_OFFLINE_MESSAGE;
  }
  try {
    const data = JSON.parse(text);
    if (data.error) return data.error;
  } catch {
    // not json
  }
  return text.trim() || `HTTP ${response.status}`;
}

async function parseJson(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(formatApiError(response, text));
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
}

export async function checkMusicApi() {
  const base = getApiBaseUrl();
  try {
    const healthRes = await fetch(`${base}/api/health`);
    if (healthRes.ok) {
      const health = await healthRes.json();
      if (health.version >= 2) return true; // v3: user track versions
    }
    const response = await fetch(`${base}/api/music`);
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data.tracks) && Array.isArray(data.authors);
  } catch {
    return false;
  }
}

function normalizeCatalogAuthor(author) {
  if (!author || typeof author !== 'object') return null;

  return {
    ...author,
    name: String(author.name || '').trim() || 'Автор',
    avatarUrl: resolveAuthorAvatarUrl(author),
  };
}

function normalizeCatalog(data) {
  return {
    tracks: data.tracks ?? [],
    authors: (data.authors ?? [])
      .map(normalizeCatalogAuthor)
      .filter(Boolean),
  };
}

export async function fetchMusicCatalog() {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(`${base}/api/music`);
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseJson(response);
  return normalizeCatalog(data);
}

export async function fetchMusicTracks() {
  const data = await fetchMusicCatalog();
  return data.tracks;
}

export async function fetchKaraokeAiConfig() {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(`${base}/api/karaoke/ai-config`);
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  return parseJson(response);
}

export async function aiSyncKaraokeLyrics(filename, { description, save = false } = {}) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(
      `${base}/api/music/${encodeURIComponent(filename)}/karaoke/ai-sync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, save }),
      }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseJson(response);
  if (save) {
    return { ...data, ...normalizeCatalog(data) };
  }
  return data;
}

export async function autoSyncKaraokeLyrics(filename, { description, save = false } = {}) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(
      `${base}/api/music/${encodeURIComponent(filename)}/karaoke/autosync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, save }),
      }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseJson(response);
  if (save) {
    return { ...data, ...normalizeCatalog(data) };
  }
  return data;
}

export async function updateMusicTrack(filename, payload) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(
      `${base}/api/music/${encodeURIComponent(filename)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseJson(response);
  return { ...data, ...normalizeCatalog(data) };
}

export async function uploadMusicFiles(files) {
  const base = getApiBaseUrl();
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('tracks', file, file.name);
  });

  let response;
  try {
    response = await fetch(`${base}/api/music`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }

  const data = await parseJson(response);
  return { ...data, ...normalizeCatalog(data) };
}

export async function deleteMusicTrack(filename) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(
      `${base}/api/music/${encodeURIComponent(filename)}`,
      { method: 'DELETE' }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseJson(response);
  return { ...data, ...normalizeCatalog(data) };
}
