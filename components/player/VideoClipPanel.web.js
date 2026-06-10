import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
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

  useEffect(() => {
    if (!active || !clip) {
      setEmbedError(false);
      return;
    }
    markPlayStart(initialSecRef.current);
    if (onProgress) onProgress(initialSecRef.current);
  }, [active, clip?.provider, clip?.videoId, onProgress]);

  useEffect(() => {
    if (!active || !onProgress || !playStartedAtRef.current) return undefined;
    const interval = setInterval(() => {
      onProgress((Date.now() - playStartedAtRef.current) / 1000);
    }, 400);
    return () => clearInterval(interval);
  }, [active, onProgress]);

  if (!active || !clip) return null;

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
          <Text style={styles.errorText}>Клип недоступен для встраивания</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        compactLarge && styles.wrapCompactLarge,
      ]}
    >
      <View style={[styles.playerWrap, { height: videoHeight }]}>
        <WebView
          source={{ uri: clip.embedUrl }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          onLoad={() => markPlayStart(initialSecRef.current)}
          onError={() => setEmbedError(true)}
        />
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
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
