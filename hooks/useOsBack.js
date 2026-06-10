import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/** Android / системная кнопка «Назад» (Modal onRequestClose на Android тоже). */
export function useOsBack(handler, enabled = true) {
  useEffect(() => {
    if (!enabled || !handler) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handler();
      return true;
    });

    return () => subscription.remove();
  }, [handler, enabled]);
}
