import { useCallback, useState } from 'react';

export function useSliderWithInput({
  minValue = 0,
  maxValue = 100,
  initialValue = [minValue],
  defaultValue = [minValue],
} = {}) {
  const [sliderValue, setSliderValue] = useState(initialValue);
  const [inputValues, setInputValues] = useState(
    initialValue.map((v) => v.toString())
  );

  const syncValues = useCallback((values) => {
    const next = values.map((v) =>
      Math.min(maxValue, Math.max(minValue, Math.round(v)))
    );
    setSliderValue(next);
    setInputValues(next.map((v) => v.toString()));
  }, [minValue, maxValue]);

  const validateAndUpdateValue = useCallback(
    (rawValue, index) => {
      if (rawValue === '' || rawValue === '-') {
        const next = [...sliderValue];
        next[index] = minValue;
        syncValues(next);
        return;
      }

      const numValue = parseFloat(rawValue);
      if (Number.isNaN(numValue)) {
        const restored = [...inputValues];
        restored[index] = sliderValue[index].toString();
        setInputValues(restored);
        return;
      }

      let clampedValue = Math.min(maxValue, Math.max(minValue, numValue));
      if (sliderValue.length > 1) {
        if (index === 0) {
          clampedValue = Math.min(clampedValue, sliderValue[1]);
        } else {
          clampedValue = Math.max(clampedValue, sliderValue[0]);
        }
      }

      const next = [...sliderValue];
      next[index] = clampedValue;
      syncValues(next);
    },
    [sliderValue, inputValues, minValue, maxValue, syncValues]
  );

  const handleInputChange = useCallback(
    (text, index) => {
      if (text === '' || /^-?\d*\.?\d*$/.test(text)) {
        const next = [...inputValues];
        next[index] = text;
        setInputValues(next);
      }
    },
    [inputValues]
  );

  const handleSliderChange = useCallback(
    (newValue) => {
      syncValues(newValue);
    },
    [syncValues]
  );

  const resetToDefault = useCallback(() => {
    syncValues(defaultValue);
  }, [defaultValue, syncValues]);

  return {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    syncValues,
  };
}
