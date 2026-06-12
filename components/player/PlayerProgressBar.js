import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/formatTime';

export default function PlayerProgressBar({
  positionMillis,
  durationMillis,
  onSeek,
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const startRatioRef = useRef(0);
  const scrubRatioRef = useRef(0);
  const trackWidthRef = useRef(0);

  const progress =
    durationMillis > 0 ? Math.min(positionMillis / durationMillis, 1) : 0;

  const displayProgress = isScrubbing ? scrubRatio : progress;
  const displayPosition = isScrubbing
    ? scrubRatio * durationMillis
    : positionMillis;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const width = trackWidthRef.current;
          if (!width) return;

          const ratio = Math.max(
            0,
            Math.min(event.nativeEvent.locationX / width, 1)
          );
          startRatioRef.current = ratio;
          scrubRatioRef.current = ratio;
          setScrubRatio(ratio);
          setIsScrubbing(true);
        },
        onPanResponderMove: (_, gestureState) => {
          const width = trackWidthRef.current;
          if (!width) return;

          const ratio = Math.max(
            0,
            Math.min(
              (startRatioRef.current * width + gestureState.dx) / width,
              1
            )
          );
          scrubRatioRef.current = ratio;
          setScrubRatio(ratio);
        },
        onPanResponderRelease: () => {
          if (durationMillis > 0) {
            onSeek(scrubRatioRef.current * durationMillis);
          }
          setIsScrubbing(false);
        },
        onPanResponderTerminate: () => {
          setIsScrubbing(false);
        },
      }),
    [durationMillis, onSeek]
  );

  const onTrackLayout = useCallback((event) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  }, []);

  return (
    <View style={styles.block}>
      <View
        style={styles.trackHit}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(displayProgress * 100, 0)}%` },
            ]}
          />
        </View>
        <View
          style={[
            styles.progressThumb,
            { left: `${Math.max(displayProgress * 100, 0)}%` },
            isScrubbing && styles.progressThumbActive,
          ]}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(displayPosition)}</Text>
        <Text style={styles.time}>{formatTime(durationMillis)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 20,
  },
  trackHit: {
    height: 28,
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -6,
    top: 8,
  },
  progressThumbActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    top: 7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
});
