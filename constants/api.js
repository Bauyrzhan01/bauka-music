import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_PORT = 3001;

let runtimeOverride = null;
let cachedOverride = null;
let overrideLoaded = false;

export function setRuntimeApiBaseUrl(url) {
  runtimeOverride = url ? String(url).trim().replace(/\/$/, '') : null;
}

export async function ensureApiBaseOverrideLoaded() {
  if (overrideLoaded) return cachedOverride;
  const { loadApiBaseOverride } = await import('../storage/apiBaseStorage');
  cachedOverride = await loadApiBaseOverride();
  overrideLoaded = true;
  if (cachedOverride) {
    runtimeOverride = cachedOverride;
  }
  return cachedOverride;
}

function isLocalHost(hostname) {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

function getDebuggerHost() {
  return (
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    null
  );
}

function urlFromDebuggerHost() {
  const debuggerHost = getDebuggerHost();
  if (!debuggerHost) return null;
  const ip = debuggerHost.split(':')[0];
  if (!ip || isLocalHost(ip)) return null;
  return `http://${ip}:${API_PORT}`;
}

function urlFromEnvOrExtra() {
  const candidates = [
    process.env.EXPO_PUBLIC_API_URL,
    Constants.expoConfig?.extra?.apiUrl,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const url = String(raw).trim().replace(/\/$/, '');
    if (!url) continue;

    if (Platform.OS !== 'web') {
      try {
        const { hostname } = new URL(url);
        if (isLocalHost(hostname)) continue;
      } catch {
        continue;
      }
    }

    return url;
  }

  return null;
}

function urlFromWebPage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  const { hostname, protocol } = window.location;
  const scheme = protocol === 'https:' ? 'https' : 'http';
  const apiHost = isLocalHost(hostname) ? '127.0.0.1' : hostname;
  return `${scheme}://${apiHost}:${API_PORT}`;
}

export function getApiBaseUrl() {
  if (runtimeOverride) {
    return runtimeOverride;
  }

  if (cachedOverride) {
    return cachedOverride;
  }

  // Браузер: API на том же хосте, что и админка (не старый IP из .env)
  const fromWeb = urlFromWebPage();
  if (fromWeb) {
    return fromWeb;
  }

  // Expo Go: IP из Metro надёжнее, чем старый .env на ПК
  if (Platform.OS !== 'web') {
    const fromDebugger = urlFromDebuggerHost();
    if (fromDebugger) {
      return fromDebugger;
    }
  }

  const fromConfig = urlFromEnvOrExtra();
  if (fromConfig) {
    return fromConfig;
  }

  return `http://127.0.0.1:${API_PORT}`;
}

export function resetApiBaseOverride() {
  runtimeOverride = null;
  cachedOverride = null;
  overrideLoaded = false;
}

export function getApiBaseUrlSource() {
  if (runtimeOverride || cachedOverride) return 'manual';
  if (urlFromWebPage()) return 'web';
  if (Platform.OS !== 'web' && urlFromDebuggerHost()) return 'expo-go';
  if (urlFromEnvOrExtra()) return 'env';
  return 'fallback';
}
