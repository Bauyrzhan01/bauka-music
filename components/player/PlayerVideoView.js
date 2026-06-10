import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function PlayerVideoView({ uri, isPlaying, onProgress }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    if (!player) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  useEffect(() => {
    if (!player || !onProgress) return undefined;

    const interval = setInterval(() => {
      onProgress({
        positionMillis: Math.round((player.currentTime || 0) * 1000),
        durationMillis: Math.round((player.duration || 0) * 1000),
      });
    }, 400);

    return () => clearInterval(interval);
  }, [player, onProgress]);

  if (!uri) return null;

  return (
    <View style={styles.wrap}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
