import { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSliderWithInput } from '../../hooks/useSliderWithInput';
import PlayerVolumeSlider from './PlayerVolumeSlider';

function volumeToPercent(value) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function percentToVolume(percent) {
  return Math.max(0, Math.min(100, percent)) / 100;
}

export default function PlayerVolumeOverlay({
  visible,
  value,
  onValueChange,
  onClose,
  accentColor = '#1DB954',
}) {
  const {
    sliderValue,
    inputValues,
    handleInputChange,
    handleSliderChange,
    validateAndUpdateValue,
    syncValues,
  } = useSliderWithInput({
    minValue: 0,
    maxValue: 100,
    initialValue: [volumeToPercent(value)],
    defaultValue: [100],
  });

  useEffect(() => {
    if (visible) {
      syncValues([volumeToPercent(value)]);
    }
  }, [visible, value, syncValues]);

  const applyPercent = (percent, { persist = true } = {}) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    syncValues([clamped]);
    onValueChange?.(percentToVolume(clamped), { persist });
  };

  const onSliderLive = (nextVolume) => {
    applyPercent(volumeToPercent(nextVolume), { persist: false });
  };

  const onSliderComplete = (nextVolume) => {
    applyPercent(volumeToPercent(nextVolume), { persist: true });
  };

  const onInputBlur = () => {
    const parsed = parseFloat(inputValues[0]);
    if (Number.isNaN(parsed)) {
      validateAndUpdateValue('0', 0);
      applyPercent(0, { persist: true });
      return;
    }
    applyPercent(parsed, { persist: true });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Закрыть"
        >
          {Platform.OS !== 'web' ? (
            <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.dim} />
        </Pressable>

        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card} pointerEvents="auto">
            <Text style={styles.title}>Громкость</Text>

            <View style={styles.sliderBlock}>
              <PlayerVolumeSlider
                value={percentToVolume(sliderValue[0])}
                onValueChange={onSliderLive}
                onSlidingComplete={onSliderComplete}
                height={240}
                accentColor={accentColor}
                large
                showIcon
                showTooltip
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={inputValues[0]}
                  onChangeText={(text) => handleInputChange(text, 0)}
                  onBlur={onInputBlur}
                  onSubmitEditing={onInputBlur}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  accessibilityLabel="Громкость в процентах"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>
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
    maxWidth: 240,
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
    marginBottom: 16,
  },
  sliderBlock: {
    alignItems: 'center',
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputSuffix: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '600',
  },
});
