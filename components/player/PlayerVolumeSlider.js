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
  accentColor = '#1DB954',
  large = false,
  showIcon = true,
  showTooltip = true,
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
  const fillPercent = displayValue * 100;

  const thumbSize = large ? 20 : 18;
  const thumbOffset = thumbSize / 2;
  const thumbTop = (1 - displayValue) * trackHeight - thumbOffset;
  const trackWidth = 8;
  const hitWidth = large ? 88 : 52;
  const thumbLeft = (hitWidth - thumbSize) / 2;

  const emitDisplayValue = useCallback((next) => {
    onDisplayValueChangeRef.current?.(next);
  }, []);

  const applyValue = useCallback(
    (next) => {
      scrubValueRef.current = next;
      setScrubValue(next);
      emitDisplayValue(next);
      onValueChangeRef.current?.(next);
    },
    [emitDisplayValue]
  );

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

  const clampedThumbTop =
    trackHeight > 0
      ? Math.max(-thumbOffset, Math.min(thumbTop, trackHeight - thumbOffset))
      : 0;

  const tooltipTop = clampedThumbTop + thumbOffset - 14;

  return (
    <View style={[styles.wrap, { width: hitWidth }]}>
      <View
        style={[styles.trackHit, { height, width: hitWidth }]}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { width: trackWidth }]}>
          <View
            style={[
              styles.range,
              {
                height: `${fillPercent}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>

        {trackHeight > 0 ? (
          <>
            {showTooltip && isScrubbing ? (
              <View
                style={[
                  styles.tooltip,
                  {
                    top: tooltipTop,
                    left: hitWidth / 2 + trackWidth / 2 + 10,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.tooltipText}>
                  {Math.round(displayValue * 100)}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.thumb,
                {
                  left: thumbLeft,
                  width: thumbSize,
                  height: thumbSize,
                  borderRadius: thumbSize / 2,
                  top: clampedThumbTop,
                  borderColor: accentColor,
                },
                isScrubbing && styles.thumbActive,
              ]}
            />
          </>
        ) : null}
      </View>

      {showIcon ? (
        <Ionicons
          name={iconName}
          size={large ? 24 : 18}
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
  trackHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  range: {
    width: '100%',
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#121212',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  thumbActive: {
    transform: [{ scale: 1.06 }],
  },
  tooltip: {
    position: 'absolute',
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(24,24,24,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  icon: {
    marginTop: 12,
  },
});
