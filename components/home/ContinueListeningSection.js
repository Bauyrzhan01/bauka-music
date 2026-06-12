import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../../context/PlayerContext';
import { loadPlaybackResume } from '../../storage/playbackResumeStorage';
import { useOffline } from '../../context/OfflineContext';
import TrackCover from '../TrackCover';
import { formatTime } from '../../utils/formatTime';

const HORIZONTAL_PADDING = 16;
const MIN_RESUME_MS = 3000;

export default function ContinueListeningSection() {
  const { catalogTracks: tracks } = useOffline();
  const { resumePlayback, currentTrack, positionMillis } = usePlayer();
  const [resume, setResume] = useState(null);

  const refresh = useCallback(async () => {
    const data = await loadPlaybackResume();
    if (!data?.trackId) {
      setResume(null);
      return;
    }

    const track = tracks.find((item) => item.id === data.trackId);
    if (!track) {
      setResume(null);
      return;
    }

    const position = data.positionMillis || 0;
    const duration = data.durationMillis || 0;
    if (position < MIN_RESUME_MS) {
      setResume(null);
      return;
    }
    if (duration > 0 && position >= duration - 5000) {
      setResume(null);
      return;
    }

    setResume({ ...data, track });
  }, [tracks]);

  useEffect(() => {
    refresh();
  }, [refresh, currentTrack?.id, positionMillis]);

  if (!resume) return null;

  if (
    currentTrack?.id === resume.trackId &&
    Math.abs(positionMillis - resume.positionMillis) < 8000
  ) {
    return null;
  }

  const progress =
    resume.durationMillis > 0
      ? Math.min(resume.positionMillis / resume.durationMillis, 1)
      : 0;

  const handlePress = async () => {
    const ok = await resumePlayback({
      trackId: resume.trackId,
      positionMillis: resume.positionMillis,
      playlistIds: resume.playlistIds,
    });
    if (ok) refresh();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={handlePress}>
        <TrackCover coverUrl={resume.track.coverUrl} size={44} borderRadius={8} />
        <View style={styles.body}>
          <Text style={styles.label}>Слушать дальше</Text>
          <Text style={styles.title} numberOfLines={1}>
            {resume.track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {resume.track.artist || 'Tolqyn'}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.time}>
            {formatTime(resume.positionMillis)}
            {resume.durationMillis > 0
              ? ` / ${formatTime(resume.durationMillis)}`
              : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    backgroundColor: '#1a1a1a',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a9a9a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  artist: {
    fontSize: 12,
    color: '#9a9a9a',
    marginTop: 2,
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2b2b2b',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2b2b2b',
    borderRadius: 2,
  },
  time: {
    fontSize: 11,
    color: '#9a9a9a',
  },
});
