import { Platform } from 'react-native';
import { getApiBaseUrl } from '../constants/api';
import { parseApiJson } from './parseApiJson';
import { resolveServerMediaUrl } from '../utils/resolveServerMediaUrl';

async function uriToUploadPayload(uri) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return { blob, name: 'avatar.jpg', type: blob.type || 'image/jpeg' };
  }
  const name = uri.split('/').pop() || 'avatar.jpg';
  return { uri, name, type: 'image/jpeg' };
}

export async function fetchProfileAvatar(email) {
  const base = getApiBaseUrl();
  const response = await fetch(
    `${base}/api/profile/avatar?email=${encodeURIComponent(email)}`
  );
  const data = await parseApiJson(response);
  const path = data.avatarPath || null;
  return {
    avatarPath: path,
    avatarUrl: path ? resolveServerMediaUrl(path) : null,
  };
}

export async function uploadProfileAvatar(email, imageUri) {
  const base = getApiBaseUrl();
  const formData = new FormData();
  formData.append('email', email.trim().toLowerCase());

  const payload = await uriToUploadPayload(imageUri);
  if (Platform.OS === 'web') {
    formData.append('avatar', payload.blob, payload.name);
  } else {
    formData.append('avatar', {
      uri: payload.uri,
      name: payload.name,
      type: payload.type,
    });
  }

  const response = await fetch(`${base}/api/profile/avatar`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseApiJson(response);
  const path = data.avatarPath || null;
  return {
    avatarPath: path,
    avatarUrl: path ? resolveServerMediaUrl(path) : null,
  };
}
