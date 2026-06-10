import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrackCover from '../TrackCover';

const CARD_WIDTH = 148;

export default function HomeTrackCard({
  track,
  isActive,
  isPlaying,
  onPlay,
  onDownload,
  onRemoveOffline,
  showOfflineBadge = false,
  downloadBusy = false,
  titleColor,
  artistColor,
}) {
  return (
    <Pressable style={styles.card} onPress={() => onPlay?.(track)}>
      <View style={styles.coverWrap}>
        <TrackCover
          coverUrl={track.coverUrl}
          size={CARD_WIDTH}
          borderRadius={12}
        />
        {showOfflineBadge || track.isOffline ? (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-done" size={12} color="#fff" />
          </View>
        ) : null}
        {onDownload ? (
          <Pressable
            style={styles.downloadBtn}
            onPress={() => onDownload(track)}
            disabled={downloadBusy}
            hitSlop={8}
          >
            {downloadBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={track.isOffline ? 'checkmark' : 'cloud-download-outline'}
                size={16}
                color="#fff"
              />
            )}
          </Pressable>
        ) : null}
        {onRemoveOffline ? (
          <Pressable
            style={styles.removeOfflineBtn}
            onPress={() => onRemoveOffline(track)}
            hitSlop={8}
          >
            <Ionicons name="close" size={14} color="#111" />
          </Pressable>
        ) : null}
        <Pressable
          style={styles.playBtn}
          onPress={() => onPlay?.(track)}
          hitSlop={8}
        >
          <Ionicons
            name={isActive && isPlaying ? 'pause' : 'play'}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
      <Text
        style={[styles.title, titleColor && { color: titleColor }]}
        numberOfLines={1}
      >
        {track.title}
      </Text>
      <Text
        style={[styles.artist, artistColor && { color: artistColor }]}
        numberOfLines={1}
      >
        {track.artist || 'Bauka Music'}
      </Text>
    </Pressable>
  );
}

export { CARD_WIDTH };

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  coverWrap: {
    marginBottom: 8,
    position: 'relative',
  },
  offlineBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  downloadBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeOfflineBtn: {
    position: 'absolute',
    top: 42,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  playBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  artist: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});
