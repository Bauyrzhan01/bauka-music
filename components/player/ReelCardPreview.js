import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { resolveVersionMediaUrl } from '../../utils/resolveVersionMediaUrl';
import { useVideoFitLayout } from '../../hooks/useVideoFitLayout';

export default function ReelCardPreview({ item, suspended = false }) {
  const uri = suspended ? null : resolveVersionMediaUrl(item);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.muted = true;
  });

  const videoLayout = useVideoFitLayout(player, bounds.width, bounds.height);

  useEffect(() => {
    if (!player) return;
    player.pause();
    try {
      player.currentTime = 0;
    } catch {
      // ignore seek before load
    }
  }, [player, uri]);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (!player || !uri) return;
    if (status === 'readyToPlay') {
      player.pause();
      try {
        player.currentTime = 0;
      } catch {
        // ignore
      }
    }
  });

  if (!uri) {
    return <View style={styles.fallback} />;
  }

  return (
    <View
      style={styles.stage}
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setBounds({ width, height });
        }
      }}
    >
      {bounds.width > 0 && bounds.height > 0 ? (
        <VideoView
          style={{
            width: videoLayout.width,
            height: videoLayout.height,
          }}
          player={player}
          contentFit="contain"
          nativeControls={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2a2a2a',
  },
});
