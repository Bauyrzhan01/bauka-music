import { Platform } from 'react-native';

export function pickMusicFiles() {
  if (Platform.OS !== 'web') {
    return Promise.resolve({ ok: false, error: 'Выбор файлов доступен только в веб-админке' });
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg,audio/mp4,audio/wav,audio/aac,audio/*,.mp3,.m4a,.wav,.aac';
    input.multiple = true;

    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (!files.length) {
        resolve({ ok: false, cancelled: true });
        return;
      }
      resolve({ ok: true, files });
    };

    input.click();
  });
}
