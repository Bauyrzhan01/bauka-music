import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  buildYoutubeThumbnailUrl,
  parseYoutubeVideoId,
} from '../../utils/parseYoutubeVideoId';
import { openYoutubeClip } from '../../utils/openYoutubeClip';

export default function YoutubeClipModal({ visible, youtubeUrl, onClose }) {
  const videoId = parseYoutubeVideoId(youtubeUrl);
  const { width } = useWindowDimensions();
  const playerHeight = Math.max(200, Math.round((width - 48) * (9 / 16)));
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const preferExternal = Platform.OS === 'web' || Platform.OS === 'android';
  const [useExternal, setUseExternal] = useState(preferExternal);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPlaying(true);
    setUseExternal(Platform.OS === 'web' || Platform.OS === 'android');
  }, [visible, videoId]);

  const handleOpenYoutube = useCallback(async () => {
    setOpening(true);
    try {
      await openYoutubeClip(youtubeUrl);
    } finally {
      setOpening(false);
    }
  }, [youtubeUrl]);

  if (!videoId) {
    return null;
  }

  const thumbnailUri = buildYoutubeThumbnailUrl(videoId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Клип</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Закрыть клип"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          {useExternal ? (
            <View style={styles.externalWrap}>
              <Image
                source={{ uri: thumbnailUri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
              <View style={styles.thumbOverlay}>
                <Ionicons name="logo-youtube" size={56} color="#fff" />
              </View>
              <Text style={styles.externalHint}>
                Клип откроется в YouTube — так надёжнее, чем встроенный плеер
              </Text>
            </View>
          ) : (
            <View style={[styles.playerWrap, { height: playerHeight }]}>
              <YoutubePlayer
                ref={playerRef}
                height={playerHeight}
                width={width - 48}
                play={playing}
                videoId={videoId}
                forceAndroidAutoplay
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                }}
                onReady={() => {
                  playerRef.current?.seekTo(0, true);
                }}
                onError={() => setUseExternal(true)}
                onChangeState={(state) => {
                  if (state === 'ended') {
                    setPlaying(false);
                  }
                }}
              />
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, opening && styles.primaryBtnDisabled]}
            onPress={handleOpenYoutube}
            disabled={opening}
          >
            {opening ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-youtube" size={22} color="#fff" />
                <Text style={styles.primaryBtnText}>Смотреть в YouTube</Text>
              </>
            )}
          </Pressable>

          {!useExternal ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setUseExternal(true)}
            >
              <Text style={styles.secondaryBtnText}>
                Не играет? Открыть в приложении YouTube
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 20,
  },
  playerWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  externalWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  externalHint: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ff0000',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  primaryBtnDisabled: {
    opacity: 0.8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#9a9a9a',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
