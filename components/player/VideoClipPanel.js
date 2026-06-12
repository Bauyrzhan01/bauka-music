import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  PLAYER_CLIP_VIDEO_HEIGHT,
  PLAYER_CLIP_KARAOKE_VIDEO_HEIGHT,
  PLAYER_SCROLL_TOP_HEIGHT,
} from '../../utils/playerTopLayout';
import { parseClipUrl } from '../../utils/parseClipUrl';

export default function VideoClipPanel({
  clipUrl,
  active,
  compact = false,
  compactLarge = false,
  initialPositionSec = 0,
  onProgress,
}) {
  const clip = parseClipUrl(clipUrl);
  const { width } = useWindowDimensions();
  const panelWidth = width - 40;
  const compactMax = compactLarge
    ? PLAYER_CLIP_KARAOKE_VIDEO_HEIGHT
    : PLAYER_CLIP_VIDEO_HEIGHT;
  const maxHeight = compact ? compactMax : PLAYER_SCROLL_TOP_HEIGHT - 8;
  const videoHeight = Math.min(Math.round(panelWidth * (9 / 16)), maxHeight);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const playStartedAtRef = useRef(0);
  const initialSecRef = useRef(Math.max(0, initialPositionSec || 0));

  useEffect(() => {
    initialSecRef.current = Math.max(0, initialPositionSec || 0);
  }, [initialPositionSec]);

  const markPlayStart = (atSec) => {
    const sec = Math.max(0, atSec ?? initialSecRef.current);
    playStartedAtRef.current = Date.now() - sec * 1000;
  };

  const seekClipTo = (seconds) => {
    const sec = Math.max(0, seconds);
    if (clip?.provider === 'youtube' && playerRef.current?.seekTo) {
      playerRef.current.seekTo(sec, true);
    }
    markPlayStart(sec);
    if (onProgress) onProgress(sec);
  };

  useEffect(() => {
    if (!active || !clip) {
      setPlaying(false);
      setEmbedError(false);
      return undefined;
    }

    setEmbedError(false);
    markPlayStart(initialSecRef.current);
    setPlaying(false);
    const timer = setTimeout(() => {
      setPlaying(true);
    }, 280);
    return () => clearTimeout(timer);
  }, [active, clip?.provider, clip?.videoId]);

  useEffect(() => {
    if (!active || !playing || !onProgress) return undefined;

    const tick = () => {
      if (clip.provider === 'youtube' && playerRef.current?.getCurrentTime) {
        playerRef.current.getCurrentTime().then((seconds) => {
          if (typeof seconds === 'number') onProgress(seconds);
        });
      } else {
        const elapsed = (Date.now() - playStartedAtRef.current) / 1000;
        onProgress(elapsed);
      }
    };

    tick();
    const interval = setInterval(tick, 400);
    return () => clearInterval(interval);
  }, [active, playing, clip?.provider, onProgress]);

  if (!active || !clip) {
    return null;
  }

  if (embedError) {
    return (
      <View
        style={[
          styles.wrap,
          compact && styles.wrapCompact,
          compactLarge && styles.wrapCompactLarge,
        ]}
      >
        <View style={[styles.errorBox, { height: videoHeight }]}>
          <Ionicons name="alert-circle-outline" size={28} color="#888888" />
          <Text style={styles.errorText}>
            Клип нельзя встроить. Проверьте ссылку в админке.
          </Text>
        </View>
      </View>
    );
  }

  const useWebEmbed = clip.provider !== 'youtube';
  const initialSec = initialSecRef.current;

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        compactLarge && styles.wrapCompactLarge,
      ]}
    >
      <View style={[styles.playerWrap, { height: videoHeight }]}>
        {useWebEmbed ? (
          <WebView
            source={{ uri: clip.embedUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoad={() => {
              markPlayStart(initialSec);
            }}
            onError={() => setEmbedError(true)}
            onHttpError={() => setEmbedError(true)}
          />
        ) : (
          <YoutubePlayer
            ref={playerRef}
            height={videoHeight}
            width={panelWidth}
            play={playing}
            videoId={clip.videoId}
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
              seekClipTo(initialSec);
              setPlaying(true);
            }}
            onError={() => setEmbedError(true)}
            onChangeState={(state) => {
              if (state === 'ended') setPlaying(false);
              if (state === 'playing' && clip.provider === 'youtube') {
                playerRef.current?.getCurrentTime?.().then((seconds) => {
                  if (typeof seconds === 'number') markPlayStart(seconds);
                });
              } else if (state === 'playing') {
                markPlayStart(initialSec);
              }
            }}
          />
        )}
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
  wrapCompact: {
    height: PLAYER_CLIP_VIDEO_HEIGHT,
  },
  wrapCompactLarge: {
    height: PLAYER_CLIP_KARAOKE_VIDEO_HEIGHT,
  },
  playerWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorBox: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 17,
  },
});
