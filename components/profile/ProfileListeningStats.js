import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchUserListeningStats } from '../../api/analyticsApi';
import {
  computeListenerInsights,
  loadListenerStats,
} from '../../storage/listenerStatsStorage';

export default function ProfileListeningStats() {
  const { user } = useAuth();
  const { tracks } = useMusicCatalog();
  const [insights, setInsights] = useState(null);

  const refresh = useCallback(async () => {
    const local = await loadListenerStats();
    let merged = computeListenerInsights(local, tracks);

    try {
      if (isStandaloneApp()) {
        setInsights(merged);
        return;
      }
      const remote = await fetchUserListeningStats(user?.email);
      if (remote?.weekMinutes > merged.weekMinutes) {
        merged = {
          ...merged,
          weekMinutes: Math.round(remote.weekMinutes),
        };
      }
      if (remote?.topTracks?.length) {
        const byId = Object.fromEntries(tracks.map((t) => [t.id, t]));
        merged.topTracks = remote.topTracks.map((row) => ({
          trackId: row.trackId,
          seconds: row.seconds,
          title: byId[row.trackId]?.title || 'Трек',
          artist: byId[row.trackId]?.artist || '',
        }));
      }
    } catch {
      // local only
    }

    setInsights(merged);
  }, [tracks, user?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!insights || insights.weekMinutes < 1) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Ваша статистика</Text>

      <View style={styles.row}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={18} color="#ffffff" />
          <Text style={styles.statValue}>{insights.weekMinutes}</Text>
          <Text style={styles.statLabel}>мин за неделю</Text>
        </View>
        {insights.soulAuthorLabel ? (
          <View style={styles.statCard}>
            <Ionicons name="heart-outline" size={18} color="#ffffff" />
            <Text style={styles.statValue} numberOfLines={1}>
              {insights.soulAuthorLabel}
            </Text>
            <Text style={styles.statLabel}>жанр души</Text>
          </View>
        ) : null}
      </View>

      {insights.topTracks.length > 0 ? (
        <View style={styles.topBox}>
          <Text style={styles.topTitle}>Топ-3 недели</Text>
          {insights.topTracks.map((row, index) => (
            <Text key={row.trackId} style={styles.topLine} numberOfLines={1}>
              {index + 1}. {row.title}
              {row.artist ? ` — ${row.artist}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9a9a9a',
    textAlign: 'center',
  },
  topBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  topTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9a9a9a',
    marginBottom: 6,
  },
  topLine: {
    fontSize: 13,
    color: '#9a9a9a',
    marginBottom: 4,
  },
});
