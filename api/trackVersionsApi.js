import { getApiBaseUrl } from '../constants/api';
import { normalizeTrackVersion } from '../utils/normalizeTrackVersion';
import { API_OFFLINE_MESSAGE, parseApiJson } from './parseApiJson';

async function fetchVersionsJson(path) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(`${base}${path}`);
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  const data = await parseApiJson(response);
  return (data.versions ?? []).map(normalizeTrackVersion);
}

export async function fetchAllTrackVersions() {
  try {
    return await fetchVersionsJson('/api/versions');
  } catch (err) {
    if (err.message?.includes('JSON') || err.message?.includes('API')) {
      throw err;
    }
    throw new Error(API_OFFLINE_MESSAGE);
  }
}

export async function fetchTrackVersions(trackId, filename) {
  if (!trackId && !filename) return [];

  try {
    const params = new URLSearchParams();
    if (filename) params.set('filename', filename);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await fetchVersionsJson(
      `/api/tracks/${encodeURIComponent(trackId)}/versions${qs}`
    );
  } catch (err) {
    if (err.message?.includes('JSON') || err.message?.includes('API')) {
      throw err;
    }
    throw new Error(API_OFFLINE_MESSAGE);
  }
}

export async function uploadTrackVersion(trackId, payload, file) {
  const base = getApiBaseUrl();
  const formData = new FormData();

  formData.append('title', payload.title || 'Мой контент');
  formData.append('description', payload.description || '');
  formData.append('type', payload.type || 'edit');
  formData.append('userEmail', payload.userEmail);
  formData.append('userName', payload.userName || '');
  formData.append('baseFilename', payload.baseFilename || '');
  formData.append('baseTrackId', trackId);

  if (payload.avatarUri) {
    const avatarName = payload.avatarName || 'avatar.jpg';
    const avatarType = payload.avatarMimeType || 'image/jpeg';
    formData.append('avatar', {
      uri: payload.avatarUri,
      name: avatarName,
      type: avatarType,
    });
  }

  if (file.uri) {
    formData.append('media', {
      uri: file.uri,
      name: file.name || 'version.mp4',
      type: file.mimeType || 'application/octet-stream',
    });
  } else {
    formData.append('media', file, file.name);
  }

  let response;
  try {
    response = await fetch(
      `${base}/api/tracks/${encodeURIComponent(trackId)}/versions`,
      { method: 'POST', body: formData }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }

  const data = await parseApiJson(response);
  return normalizeTrackVersion(data.version);
}

export async function deleteTrackVersion(versionId, userEmail) {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (userEmail) {
    params.set('userEmail', String(userEmail).trim().toLowerCase());
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  let response;
  try {
    response = await fetch(
      `${base}/api/versions/${encodeURIComponent(versionId)}${qs}`,
      { method: 'DELETE' }
    );
  } catch {
    throw new Error(API_OFFLINE_MESSAGE);
  }
  await parseApiJson(response);
}
