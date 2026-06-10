import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { isStandaloneApp } from '../../constants/standalone';
import { sendListeningHeartbeat } from '../../api/listeningApi';
import { getBaseTrackId } from '../../utils/buildPlaybackTrack';
import { recordListenTick } from '../../storage/listenerStatsStorage';

const INTERVAL_MS = 20000;
const standalone = isStandaloneApp();

export default function ListeningHeartbeat({ screen = 'player' }) {
  const { user } = useAuth();
  const { baseTrack, currentTrack, isPlaying } = usePlayer();
  const timerRef = useRef(null);

  useEffect(() => {
    const send = () => {
      const trackId = getBaseTrackId(currentTrack) || baseTrack?.id;
      const payload = {
        userId: user?.email,
        userName: user?.name,
        userEmail: user?.email,
        trackId: trackId || null,
        authorId: baseTrack?.authorId || null,
        title: baseTrack?.title || currentTrack?.title || '',
        artist: baseTrack?.artist || currentTrack?.artist || '',
        isPlaying: !!(isPlaying && trackId),
        elapsedSec: INTERVAL_MS / 1000,
        screen,
      };

      if (!standalone) {
        sendListeningHeartbeat(payload);
      }

      if (payload.isPlaying && trackId) {
        recordListenTick({
          trackId,
          authorId: baseTrack?.authorId,
          seconds: INTERVAL_MS / 1000,
        });
      }
    };

    send();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(send, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!standalone) {
        sendListeningHeartbeat({
          userId: user?.email,
          userName: user?.name,
          isPlaying: false,
          screen,
        });
      }
    };
  }, [
    user?.email,
    user?.name,
    baseTrack?.id,
    baseTrack?.title,
    baseTrack?.artist,
    baseTrack?.authorId,
    currentTrack?.id,
    currentTrack?.title,
    currentTrack?.artist,
    isPlaying,
    screen,
  ]);

  return null;
}
