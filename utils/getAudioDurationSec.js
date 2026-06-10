import { createAudioPlayer } from 'expo-audio';

const LOAD_TIMEOUT_MS = 20000;

export function getAudioDurationSec(uri) {
  return new Promise((resolve, reject) => {
    if (!uri) {
      reject(new Error('Нет файла'));
      return;
    }

    let settled = false;
    const player = createAudioPlayer({ uri });

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        listener?.remove();
      } catch {
        // ignore
      }
      try {
        player.remove();
      } catch {
        // ignore
      }
      fn(value);
    };

    const listener = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.isLoaded) return;
      if (status.duration > 0) {
        finish(resolve, status.duration);
      }
    });

    const timer = setTimeout(() => {
      finish(reject, new Error('Не удалось определить длительность трека'));
    }, LOAD_TIMEOUT_MS);
  });
}
