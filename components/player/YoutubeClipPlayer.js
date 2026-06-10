import { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  buildYoutubeEmbedUrl,
  parseYoutubeVideoId,
} from '../../utils/parseYoutubeVideoId';

export default function YoutubeClipPlayer({ youtubeUrl, playing = true }) {
  const videoId = useMemo(
    () => parseYoutubeVideoId(youtubeUrl),
    [youtubeUrl]
  );

  if (!videoId) {
    return null;
  }

  const embedUrl = buildYoutubeEmbedUrl(videoId, { autoplay: playing });

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <iframe
          title="YouTube clip"
          src={embedUrl}
          style={styles.iframeWeb}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  iframeWeb: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    borderRadius: 12,
  },
});
