import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchAnalyticsSummary } from '../../api/analyticsApi';
import { fetchMusicCatalog } from '../../api/musicApi';
import AdminPageHeader from './AdminPageHeader';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

function RankList({ title, rows, resolveLabel }) {
  if (!rows?.length) {
    return (
      <View style={styles.block}>
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={styles.empty}>Пока нет данных</Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {rows.map((row, index) => (
        <View key={`${row.id}-${index}`} style={styles.rankRow}>
          <Text style={styles.rankIndex}>{index + 1}</Text>
          <Text style={styles.rankLabel} numberOfLines={1}>
            {resolveLabel(row.id)}
          </Text>
          <Text style={styles.rankValue}>{row.count}</Text>
        </View>
      ))}
    </View>
  );
}

export default function WebAdminAnalytics() {
  const { isMobile } = useWebBreakpoint();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [tracksById, setTracksById] = useState({});

  useEffect(() => {
    Promise.all([fetchAnalyticsSummary(), fetchMusicCatalog()])
      .then(([analytics, catalog]) => {
        setSummary(analytics);
        const map = Object.fromEntries(
          (catalog.tracks || []).map((track) => [track.id, track])
        );
        setTracksById(map);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const trackLabel = (id) => {
    const track = tracksById[id];
    if (track) return `${track.title}${track.artist ? ` — ${track.artist}` : ''}`;
    return id;
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!summary) {
    return (
      <Text style={styles.error}>
        Не удалось загрузить аналитику. Запустите npm start.
      </Text>
    );
  }

  return (
    <View>
      <AdminPageHeader
        title="Аналитика"
        subtitle="Прослушивания, клипы, reels и откуда заходят в приложение"
      />

      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.totalListenMinutes}</Text>
          <Text style={styles.metricLabel}>минут прослушано</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.activeUsers}</Text>
          <Text style={styles.metricLabel}>слушателей</Text>
        </View>
      </View>

      <RankList
        title="Топ треков"
        rows={summary.topTracks}
        resolveLabel={trackLabel}
      />
      <RankList
        title="Просмотры клипов"
        rows={summary.topClips}
        resolveLabel={trackLabel}
      />
      <RankList
        title="Просмотры Reels"
        rows={summary.topReels}
        resolveLabel={(id) => id}
      />
      <RankList
        title="Откуда заходят (экраны)"
        rows={summary.entryScreens}
        resolveLabel={(id) => id}
      />

      <Text style={styles.updated}>
        Обновлено: {summary.updatedAt || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  error: { color: '#c00', marginTop: 16 },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 18,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  block: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  empty: {
    fontSize: 13,
    color: '#888',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankIndex: {
    width: 22,
    fontWeight: '700',
    color: '#888',
  },
  rankLabel: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  rankValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  updated: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
});
