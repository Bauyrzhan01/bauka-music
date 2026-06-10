import { getApiBaseUrl } from '../constants/api';
import { parseApiJson } from './parseApiJson';

export async function checkApiHealth(baseUrl = getApiBaseUrl()) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/health`, {
    method: 'GET',
  });
  const data = await parseApiJson(response);
  return { ok: true, baseUrl: baseUrl.replace(/\/$/, ''), data };
}
