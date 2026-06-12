import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { isStandaloneApp } from '../../constants/standalone';
import { fetchNowPlaying } from '../../api/listeningApi';
import { useMusicCatalog } from '../../context/MusicCatalogContext';

const standalone = isStandaloneApp();

const POLL_MS = 15000;

export default function NowPlayingSection() {
  const { tracks } = useMusicCatalog();
  const [listeners, setListeners] = useState([]);
  const [loading, setLoading] = useState(!standalone);

  const load = useCallback(async () => {
    if (standalone) return;
    try {
      const list = await fetchNowPlaying();
      setListeners(list.filter((entry) => entry.trackId));
    } catch {
      setListeners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (standalone) return undefined;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (standalone) return null;

  if (loading && !listeners.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Сейчас слушают</Text>
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      </View>
    );
  }

  if (!listeners.length) return null;

  const coverForTrack = (trackId) =>
    tracks.find((track) => track.id === trackId)?.coverUrl ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="radio" size={18} color="#ffffff" />
        <Text style={styles.title}>Сейчас слушают</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {listeners.map((entry, index) => {
          const coverUrl = coverForTrack(entry.trackId);
          return (
            <View
              key={`${entry.userName}-${entry.trackId}-${index}`}
              style={styles.chip}
            >
              <View style={styles.chipIcon}>
                {coverUrl ? (
                  <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="musical-note" size={14} color="#ffffff" />
                )}
              </View>
              <View style={styles.chipText}>
                <Text style={styles.chipUser} numberOfLines={1}>
                  {entry.userName}
                </Text>
                <Text style={styles.chipTrack} numberOfLines={1}>
                  {entry.title}
                  {entry.artist ? ` · ${entry.artist}` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loader: {
    paddingVertical: 8,
  },
  row: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  chipText: {
    flex: 1,
    minWidth: 0,
  },
  chipUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  chipTrack: {
    fontSize: 11,
    color: '#9a9a9a',
    marginTop: 2,
  },
});
