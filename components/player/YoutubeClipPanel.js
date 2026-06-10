import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { PLAYER_SCROLL_TOP_HEIGHT } from '../../utils/playerTopLayout';
import { parseYoutubeVideoId } from '../../utils/parseYoutubeVideoId';

export default function YoutubeClipPanel({ youtubeUrl, active }) {
  const videoId = parseYoutubeVideoId(youtubeUrl);
  const { width } = useWindowDimensions();
  const panelWidth = width - 40;
  const videoHeight = Math.min(
    Math.round(panelWidth * (9 / 16)),
    PLAYER_SCROLL_TOP_HEIGHT - 8
  );
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    if (!active || !videoId) {
      setPlaying(false);
      setEmbedError(false);
      return undefined;
    }

    setEmbedError(false);
    setPlaying(false);
    const timer = setTimeout(() => setPlaying(true), 280);
    return () => clearTimeout(timer);
  }, [active, videoId]);

  if (!active || !videoId) {
    return null;
  }

  if (embedError) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.errorBox, { height: videoHeight }]}>
          <Ionicons name="alert-circle-outline" size={32} color="#888" />
          <Text style={styles.errorText}>
            Это видео нельзя встроить в приложение.{'\n'}
            Выберите другой ролик в админке.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.playerWrap, { height: videoHeight }]}>
        <YoutubePlayer
          ref={playerRef}
          height={videoHeight}
          width={panelWidth}
          play={playing}
          videoId={videoId}
          forceAndroidAutoplay
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            preventFullScreen: false,
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            androidLayerType: 'hardware',
          }}
          onReady={() => {
            playerRef.current?.seekTo(0, true);
            setPlaying(true);
          }}
          onError={() => setEmbedError(true)}
          onChangeState={(state) => {
            if (state === 'ended') {
              setPlaying(false);
            }
          }}
        />
        {!playing ? (
          <Pressable
            style={styles.playOverlay}
            onPress={() => {
              setPlaying(true);
              playerRef.current?.seekTo(0, true);
            }}
            accessibilityLabel="Воспроизвести клип"
          >
            <View style={styles.playCircle}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: PLAYER_SCROLL_TOP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  errorBox: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
  },
});
