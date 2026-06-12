import { loadListenerStats } from '../storage/listenerStatsStorage';

export async function buildTop10Tracks(catalogTracks = []) {
  if (!catalogTracks.length) return [];

  const stats = await loadListenerStats();
  const rankedIds = Object.entries(stats.tracks || {})
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => trackId);

  const byStats = rankedIds
    .map((id) => catalogTracks.find((track) => track.id === id))
    .filter(Boolean);

  const seen = new Set(byStats.map((track) => track.id));
  const filler = catalogTracks.filter((track) => !seen.has(track.id));

  return [...byStats, ...filler].slice(0, 10);
}
