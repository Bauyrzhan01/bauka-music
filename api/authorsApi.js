import { Platform } from 'react-native';
import { getApiBaseUrl } from '../constants/api';
import { resolveAuthorAvatarUrl } from '../utils/resolveServerMediaUrl';

function normalizeAuthor(author) {
  if (!author || typeof author !== 'object') return null;

  return {
    ...author,
    name: String(author.name || '').trim() || 'Автор',
    avatarUrl: resolveAuthorAvatarUrl(author),
  };
}

const API_OFFLINE_MESSAGE =
  'API устарел. Остановите терминал (Ctrl+C) и запустите: npm start';

async function parseJson(response) {
  const text = await response.text();
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
    throw new Error(
      `${API_OFFLINE_MESSAGE}\n(маршрут ${response.url} недоступен — перезапустите сервер)`
    );
  }
  if (!response.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(data.error || `HTTP ${response.status}`);
    } catch (error) {
      if (error.message && !error.message.includes('JSON')) throw error;
      throw new Error(text || `HTTP ${response.status}`);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
}

async function uriToUploadPayload(uri) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return { blob, name: 'avatar.jpg', type: blob.type || 'image/jpeg' };
  }
  const name = uri.split('/').pop() || 'avatar.jpg';
  return { uri, name, type: 'image/jpeg' };
}

async function appendAvatarToFormData(formData, avatarUri) {
  const payload = await uriToUploadPayload(avatarUri);
  if (Platform.OS === 'web') {
    formData.append('avatar', payload.blob, payload.name);
  } else {
    formData.append('avatar', {
      uri: payload.uri,
      name: payload.name,
      type: payload.type,
    });
  }
}

export async function fetchAuthors() {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/authors`);
  const data = await parseJson(response);
  return (data.authors ?? []).map(normalizeAuthor).filter(Boolean);
}

export async function fetchAuthor(id) {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/authors/${encodeURIComponent(id)}`);
  const data = await parseJson(response);
  return normalizeAuthor(data.author);
}

export async function createAuthor(payload) {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/authors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  return normalizeAuthor(data.author ?? data);
}

export async function updateAuthorApi(id, { name, bio, avatarUri }) {
  const base = getApiBaseUrl();
  const hasNewAvatar = avatarUri && !avatarUri.startsWith('http');

  if (hasNewAvatar) {
    const formData = new FormData();
    if (name !== undefined) formData.append('name', name);
    if (bio !== undefined) formData.append('bio', bio);
    await appendAvatarToFormData(formData, avatarUri);

    const response = await fetch(
      `${base}/api/authors/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: formData }
    );
    const data = await parseJson(response);
    return { ok: data.ok, author: normalizeAuthor(data.author) };
  }

  const response = await fetch(`${base}/api/authors/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, bio }),
  });
  const data = await parseJson(response);
  return { ok: data.ok, author: normalizeAuthor(data.author) };
}

export async function deleteAuthorApi(id) {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/authors/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return parseJson(response);
}
