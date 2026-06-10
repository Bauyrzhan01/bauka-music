import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrackCover from '../TrackCover';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';

const COVER_SIZE = 48;

export default function TrackResultItem({ track, onPress, active }) {
  const coverUrl = enrichTrackWithCover(track).coverUrl;

  return (
    <Pressable
      style={[styles.row, active && styles.rowActive]}
      onPress={() => onPress?.(track)}
    >
      <TrackCover
        coverUrl={coverUrl}
        size={COVER_SIZE}
        borderRadius={10}
        iconSize={22}
      />
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        {track.artist ? (
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        ) : (
          <Text style={styles.artist} numberOfLines={1}>
            Локальный трек
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  rowActive: {
    backgroundColor: '#f7f7f7',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  artist: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
