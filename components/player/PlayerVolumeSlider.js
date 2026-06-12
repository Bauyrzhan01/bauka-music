import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ratioFromY(y, height) {
  if (!height) return 0;
  return Math.max(0, Math.min(1 - y / height, 1));
}

export default function PlayerVolumeSlider({
  value = 1,
  onValueChange,
  onSlidingComplete,
  onDisplayValueChange,
  height = 160,
  accentColor = '#fff',
  large = false,
  showIcon = true,
}) {
  const [trackHeight, setTrackHeight] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(value);
  const startValueRef = useRef(value);
  const scrubValueRef = useRef(value);
  const trackHeightRef = useRef(0);
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  const onDisplayValueChangeRef = useRef(onDisplayValueChange);

  onValueChangeRef.current = onValueChange;
  onSlidingCompleteRef.current = onSlidingComplete;
  onDisplayValueChangeRef.current = onDisplayValueChange;

  const displayValue = isScrubbing ? scrubValue : value;

  const emitDisplayValue = useCallback((next) => {
    onDisplayValueChangeRef.current?.(next);
  }, []);

  const applyValue = useCallback((next) => {
    scrubValueRef.current = next;
    setScrubValue(next);
    emitDisplayValue(next);
    onValueChangeRef.current?.(next);
  }, [emitDisplayValue]);
  const fillPercent = displayValue * 100;
  const thumbSize = large ? 32 : 20;
  const thumbOffset = thumbSize / 2;
  const thumbTop = (1 - displayValue) * trackHeight - thumbOffset;
  const trackWidth = large ? 8 : 4;
  const hitWidth = large ? 72 : 44;
  const thumbLeft = (hitWidth - thumbSize) / 2;

  useEffect(() => {
    if (!isScrubbing) {
      setScrubValue(value);
      emitDisplayValue(value);
    }
  }, [value, isScrubbing, emitDisplayValue]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const heightPx = trackHeightRef.current;
          if (!heightPx) return;

          const next = ratioFromY(event.nativeEvent.locationY, heightPx);
          startValueRef.current = next;
          setIsScrubbing(true);
          applyValue(next);
        },
        onPanResponderMove: (_, gestureState) => {
          const heightPx = trackHeightRef.current;
          if (!heightPx) return;

          const next = Math.max(
            0,
            Math.min(startValueRef.current - gestureState.dy / heightPx, 1)
          );
          applyValue(next);
        },
        onPanResponderRelease: () => {
          const finalValue = scrubValueRef.current;
          onValueChangeRef.current?.(finalValue);
          onSlidingCompleteRef.current?.(finalValue);
          emitDisplayValue(finalValue);
          setIsScrubbing(false);
        },
        onPanResponderTerminate: () => {
          setIsScrubbing(false);
        },
      }),
    [applyValue, emitDisplayValue]
  );

  const onTrackLayout = useCallback((event) => {
    const h = event.nativeEvent.layout.height;
    trackHeightRef.current = h;
    setTrackHeight(h);
  }, []);

  const iconName =
    displayValue <= 0.01
      ? 'volume-mute'
      : displayValue < 0.5
        ? 'volume-low'
        : 'volume-high';

  return (
    <View style={[styles.wrap, { width: hitWidth }]}>
      {isScrubbing && !large ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {Math.round(displayValue * 100)}%
          </Text>
        </View>
      ) : null}

      <View
        style={[styles.trackHit, { height, width: hitWidth }]}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { width: trackWidth }]}>
          <View
            style={[
              styles.fill,
              {
                height: `${fillPercent}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>

        {trackHeight > 0 ? (
          <View
            style={[
              styles.thumb,
              large && styles.thumbLarge,
              {
                left: thumbLeft,
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                top: Math.max(
                  -thumbOffset,
                  Math.min(thumbTop, trackHeight - thumbOffset)
                ),
              },
              isScrubbing && !large && styles.thumbActive,
              isScrubbing && large && styles.thumbLargeActive,
            ]}
          />
        ) : null}
      </View>

      {showIcon ? (
        <Ionicons
          name={iconName}
          size={large ? 26 : 18}
          color="rgba(255,255,255,0.72)"
          style={styles.icon}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  tooltip: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trackHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  thumbLarge: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumbActive: {
    transform: [{ scale: 1.1 }],
  },
  thumbLargeActive: {
    transform: [{ scale: 1.08 }],
  },
  icon: {
    marginTop: 10,
  },
});
