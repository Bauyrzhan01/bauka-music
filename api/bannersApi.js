import { Platform } from 'react-native';
import { getApiBaseUrl } from '../constants/api';
import { normalizeBanner } from '../data/banners';

async function parseJson(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

async function uriToUploadPayload(uri) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return { blob, name: 'banner.jpg', type: blob.type || 'image/jpeg' };
  }
  const name = uri.split('/').pop() || 'banner.jpg';
  return { uri, name, type: 'image/jpeg' };
}

async function buildFormData(imageUri, fields = {}) {
  const formData = new FormData();
  const payload = await uriToUploadPayload(imageUri);

  if (Platform.OS === 'web') {
    formData.append('image', payload.blob, payload.name);
  } else {
    formData.append('image', {
      uri: payload.uri,
      name: payload.name,
      type: payload.type,
    });
  }

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  return formData;
}

export async function fetchBanners() {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/banners`);
  const data = await parseJson(response);
  return data.map(normalizeBanner);
}

export async function createBanner(imageUri, active) {
  const base = getApiBaseUrl();
  const formData = await buildFormData(imageUri, { active });
  const response = await fetch(`${base}/api/banners`, {
    method: 'POST',
    body: formData,
  });
  return normalizeBanner(await parseJson(response));
}

export async function updateBannerApi(id, { imageUri, active }) {
  const base = getApiBaseUrl();

  if (imageUri && !imageUri.startsWith('http')) {
    const fields = {};
    if (active !== undefined) fields.active = active;
    const formData = await buildFormData(imageUri, fields);
    const response = await fetch(`${base}/api/banners/${id}`, {
      method: 'PATCH',
      body: formData,
    });
    return normalizeBanner(await parseJson(response));
  }

  const formData = new FormData();
  if (active !== undefined) {
    formData.append('active', String(active));
  }
  const response = await fetch(`${base}/api/banners/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  return normalizeBanner(await parseJson(response));
}

export async function deleteBannerApi(id) {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/banners/${id}`, {
    method: 'DELETE',
  });
  return parseJson(response);
}

export async function setBannerActive(id, active) {
  return updateBannerApi(id, { active });
}
