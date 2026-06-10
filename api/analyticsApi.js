import { getApiBaseUrl } from '../constants/api';
import { parseApiJson } from './parseApiJson';

export async function fetchAnalyticsSummary() {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/analytics/summary`);
  return parseApiJson(response);
}

export async function fetchUserListeningStats(email) {
  if (!email) {
    return {
      weekMinutes: 0,
      topTracks: [],
      soulAuthorId: null,
      soulAuthorLabel: null,
    };
  }
  const base = getApiBaseUrl();
  const response = await fetch(
    `${base}/api/analytics/user?email=${encodeURIComponent(email)}`
  );
  return parseApiJson(response);
}
