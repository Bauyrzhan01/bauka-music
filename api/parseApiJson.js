export const API_OFFLINE_MESSAGE =
  'API-сервер не запущен. Остановите Expo и запустите: npm start';

export function formatApiError(response, text) {
  const body = text?.trim() || '';

  if (
    body.includes('Cannot POST') ||
    body.includes('Cannot GET') ||
    body.includes('<!DOCTYPE') ||
    body.includes('<html')
  ) {
    return `${API_OFFLINE_MESSAGE} (перезапустите npm start на ноутбуке)`;
  }

  try {
    const data = JSON.parse(body);
    if (data?.error) return String(data.error);
  } catch {
    // not json
  }

  return body || `HTTP ${response?.status || '?'}`;
}

export async function parseApiJson(response) {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(formatApiError(response, text));
  }

  if (!text.trim()) {
    throw new Error('Пустой ответ сервера');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      'Сервер вернул не JSON. Перезапустите npm start и обновите приложение.'
    );
  }
}

import { getApiBaseUrl } from '../constants/api';

export async function isApiVersionsSupported() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/health`);
    const data = await parseApiJson(response);
    return data.version >= 3 || data.features?.includes('versions');
  } catch {
    return false;
  }
}
