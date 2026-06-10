import { Linking, Platform } from 'react-native';
import {
  buildYoutubeWatchUrl,
  parseYoutubeVideoId,
} from './parseYoutubeVideoId';

/**
 * Открывает клип в приложении YouTube или в браузере.
 * @param {string} youtubeUrl
 * @returns {Promise<boolean>}
 */
export async function openYoutubeClip(youtubeUrl) {
  const videoId = parseYoutubeVideoId(youtubeUrl);
  if (!videoId) return false;

  const watchUrl = buildYoutubeWatchUrl(videoId);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
    return true;
  }

  const candidates = [
    Platform.OS === 'ios' ? `youtube://watch?v=${videoId}` : null,
    `vnd.youtube://${videoId}`,
    watchUrl,
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // try next
    }
  }

  try {
    await Linking.openURL(watchUrl);
    return true;
  } catch {
    return false;
  }
}
