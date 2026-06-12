import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import PlayerVolumeSlider from './PlayerVolumeSlider';

export default function PlayerVolumeOverlay({
  visible,
  value,
  onValueChange,
  onClose,
  accentColor = '#fff',
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setDisplayValue(value);
    }
  }, [visible]);

  const percent = Math.round(displayValue * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Закрыть">
          {Platform.OS !== 'web' ? (
            <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.dim} />
        </Pressable>

        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card} pointerEvents="auto">
            <Text style={styles.title}>Громкость</Text>
            <Text style={[styles.percent, { color: accentColor }]}>{percent}%</Text>
            <PlayerVolumeSlider
              value={value}
              onDisplayValueChange={setDisplayValue}
              onValueChange={(next) => onValueChange?.(next, { persist: false })}
              onSlidingComplete={(next) => onValueChange?.(next, { persist: true })}
              height={280}
              accentColor={accentColor}
              large
              showIcon
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 220,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(18,18,18,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  percent: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
});
