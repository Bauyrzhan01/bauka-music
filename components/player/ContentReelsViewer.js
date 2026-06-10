import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { resolveVersionMediaUrl } from '../../utils/resolveVersionMediaUrl';
import { useVideoFitLayout } from '../../hooks/useVideoFitLayout';
import StoriesProgressBar from './StoriesProgressBar';
import ContentAuthorRow from './ContentAuthorRow';
import { displayContentTitle } from '../../utils/displayContentTitle';
import { useOsBack } from '../../hooks/useOsBack';

const HOLD_PAUSE_MS = 1000;

function ReelSlide({
  item,
  currentUser,
  isPaused,
  slideHeight,
  slideWidth,
  onProgress,
  onEnded,
}) {
  const uri = resolveVersionMediaUrl(item);
  const shownTitle = displayContentTitle(item.title);
  const [frameReady, setFrameReady] = useState(false);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.muted = false;
    // Без этого timeUpdate не приходит — прогресс Stories не двигается
    instance.timeUpdateEventInterval = 0.2;
  });

  const videoLayout = useVideoFitLayout(player, slideWidth, slideHeight);

  useEffect(() => {
    setFrameReady(false);
    onProgress(0);
  }, [uri, onProgress]);

  useEffect(() => {
    if (!player) return;
    try {
      player.currentTime = 0;
    } catch {
      // ignore seek before load
    }
    if (!isPaused && (player.status === 'readyToPlay' || player.playing)) {
      player.play();
    }
  }, [player, uri]);

  useEffect(() => {
    if (!player) return;
    if (isPaused) {
      player.pause();
    } else if (player.status === 'readyToPlay') {
      player.play();
    }
  }, [isPaused, player]);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (!player || isPaused) return;
    if (status === 'readyToPlay') {
      player.play();
    }
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!player?.duration || player.duration <= 0) return;
    onProgress(Math.min(currentTime / player.duration, 1));
  });

  useEventListener(player, 'playToEnd', () => {
    onEnded();
  });

  useEffect(() => {
    if (!player || isPaused) return undefined;

    const tick = () => {
      const duration = player.duration;
      const current = player.currentTime;
      if (duration > 0) {
        onProgress(Math.min(current / duration, 1));
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [player, isPaused, onProgress]);

  if (!uri) {
    return (
      <View style={[styles.slide, { height: slideHeight, width: slideWidth }]}>
        <Text style={styles.errorText}>Видео недоступно</Text>
      </View>
    );
  }

  return (
    <View style={[styles.slide, { height: slideHeight, width: slideWidth }]}>
      <View style={styles.videoStage}>
        <VideoView
          style={{
            width: videoLayout.width,
            height: videoLayout.height,
          }}
          player={player}
          contentFit="contain"
          nativeControls={false}
          onFirstFrameRender={() => setFrameReady(true)}
        />
      </View>
      {!frameReady ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
      <View style={styles.gradient} />
      <View style={styles.meta}>
        {shownTitle ? (
          <Text style={styles.reelTitle}>{shownTitle}</Text>
        ) : null}
        <ContentAuthorRow
          item={item}
          currentUser={currentUser}
          variant="onDark"
          avatarSize={28}
          textStyle={styles.reelAuthor}
        />
      </View>
    </View>
  );
}

export default function ContentReelsViewer({
  visible,
  items,
  initialIndex = 0,
  trackTitle,
  onClose,
  currentUser,
}) {
  useOsBack(onClose, visible);
  const insets = useSafeAreaInsets();
  const headerTop = insets.top + 8;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideHeight, setSlideHeight] = useState(windowHeight);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [holdPaused, setHoldPaused] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const holdTimerRef = useRef(null);

  const safeInitialIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(items.length - 1, 0)
  );

  const activeItem = items[activeIndex];

  useEffect(() => {
    if (visible) {
      setActiveIndex(safeInitialIndex);
      setSegmentProgress(0);
      setHoldPaused(false);
    }
  }, [visible, safeInitialIndex]);

  useEffect(() => {
    setSegmentProgress(0);
  }, [activeIndex]);

  const goNext = useCallback(() => {
    if (activeIndex < items.length - 1) {
      setActiveIndex((index) => index + 1);
      return;
    }
    onClose?.();
  }, [activeIndex, items.length, onClose]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((index) => index - 1);
    }
  }, [activeIndex]);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePressIn = () => {
    clearHoldTimer();
    longPressTriggeredRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setHoldPaused(true);
    }, HOLD_PAUSE_MS);
  };

  const handlePressOut = () => {
    const wasHold = longPressTriggeredRef.current;
    clearHoldTimer();
    if (holdPaused) {
      setHoldPaused(false);
    }
    if (wasHold) {
      setTimeout(() => {
        longPressTriggeredRef.current = false;
      }, 80);
      return;
    }
    longPressTriggeredRef.current = false;
  };

  const handleZonePress = (direction) => {
    if (longPressTriggeredRef.current) {
      return;
    }
    if (direction === 'next') {
      goNext();
    } else {
      goPrev();
    }
  };

  const handleProgress = useCallback((value) => {
    setSegmentProgress(value);
  }, []);

  const handleEnded = useCallback(() => {
    setSegmentProgress(1);
    goNext();
  }, [goNext]);

  useEffect(() => () => clearHoldTimer(), []);

  if (!visible || !items.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={styles.root}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          if (height > 0 && Math.abs(height - slideHeight) > 1) {
            setSlideHeight(height);
          }
        }}
      >
        {activeItem ? (
          <ReelSlide
            key={activeItem.id}
            item={activeItem}
            currentUser={currentUser}
            isPaused={holdPaused}
            slideHeight={slideHeight}
            slideWidth={windowWidth}
            onProgress={handleProgress}
            onEnded={handleEnded}
          />
        ) : null}

        <StoriesProgressBar
          count={items.length}
          activeIndex={activeIndex}
          progress={segmentProgress}
          topInset={insets.top}
        />

        <View style={styles.touchLayer} pointerEvents="box-none">
          <View style={styles.touchRow}>
            <Pressable
              style={styles.touchZone}
              onPress={() => handleZonePress('prev')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
            <Pressable
              style={styles.touchZone}
              onPress={() => handleZonePress('next')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          </View>
        </View>

        {holdPaused ? (
          <View style={styles.pauseBadge}>
            <Ionicons name="pause" size={40} color="#fff" />
          </View>
        ) : null}

        <Pressable
          style={[styles.closeBtn, { top: headerTop }]}
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Закрыть"
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>

        {trackTitle ? (
          <View style={[styles.trackTag, { top: headerTop }]}>
            <Ionicons name="musical-notes" size={14} color="#fff" />
            <Text style={styles.trackTagText} numberOfLines={1}>
              {trackTitle}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    backgroundColor: '#111',
    justifyContent: 'center',
  },
  videoStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  meta: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 48,
  },
  reelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  reelAuthor: {
    color: '#ddd',
    fontSize: 14,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  touchRow: {
    flex: 1,
    flexDirection: 'row',
  },
  touchZone: {
    flex: 1,
  },
  pauseBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    zIndex: 12,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 25,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTag: {
    position: 'absolute',
    right: 12,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '55%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
