import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { LOCAL_TRACKS } from '../data/localTracks';
import { buildPlaybackTrack, getBaseTrackId } from '../utils/buildPlaybackTrack';
import {
  findTrackById,
  resolvePlaylistByIds,
} from '../utils/resolvePlaylistByIds';
import {
  clearPlaybackResume,
  savePlaybackResume,
} from '../storage/playbackResumeStorage';
import { pushRecentTrackId } from '../storage/recentListensStorage';
import { subscribeCatalogTracks } from '../utils/catalogTrackRegistry';
import { loadAppPreferences, saveAppPreferences } from '../storage/appPreferences';
import {
  buildMediaSessionMetadataAsync,
  getLockScreenOptions,
  refreshMediaSessionMetadata,
  supportsMediaSessionControls,
} from '../utils/mediaSessionMetadata';

const PlayerContext = createContext(null);

const REPEAT_MODES = ['off', 'all', 'one'];

let activeNativePlayer = null;
let activeNativeListener = null;
let lockScreenPlayer = null;

async function ensureNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (!granted) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  } catch {
    // optional — playback notification may still work via foreground service
  }
}

function releaseActiveNativePlayer() {
  activeNativeListener?.remove();
  activeNativeListener = null;

  if (activeNativePlayer) {
    try {
      activeNativePlayer.pause();
      activeNativePlayer.remove();
    } catch {
      // already released
    }
    activeNativePlayer = null;
  }
}

function clearLockScreenForPlayer(player) {
  if (!player) return;
  try {
    if (typeof player.clearLockScreenControls === 'function') {
      player.clearLockScreenControls();
    } else if (typeof player.setActiveForLockScreen === 'function') {
      player.setActiveForLockScreen(false);
    }
  } catch {
    // player may already be released
  }
  if (lockScreenPlayer === player) {
    lockScreenPlayer = null;
  }
}

async function syncMediaSession(player, track) {
  if (!supportsMediaSessionControls() || !player || !track) return;

  const metadata = await buildMediaSessionMetadataAsync(track);
  if (!metadata || typeof player.setActiveForLockScreen !== 'function') return;

  await ensureNotificationPermission();

  if (lockScreenPlayer === player) {
    await refreshMediaSessionMetadata(player, track);
    return;
  }

  player.setActiveForLockScreen(true, metadata, getLockScreenOptions());
  lockScreenPlayer = player;

  if (Platform.OS === 'ios') {
    await refreshMediaSessionMetadata(player, track);
  }
}

export function PlayerProvider({ children }) {
  const playerRef = useRef(null);
  const listenerRef = useRef(null);
  const playlistRef = useRef(LOCAL_TRACKS);
  const baseTrackRef = useRef(null);
  const currentTrackRef = useRef(null);
  const advancingRef = useRef(false);
  const repeatModeRef = useRef('off');
  const volumeRef = useRef(1);
  const mediaSessionReadyRef = useRef(false);

  const [baseTrack, setBaseTrack] = useState(null);
  const [volume, setVolumeState] = useState(1);
  const [repeatMode, setRepeatMode] = useState('off');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState(LOCAL_TRACKS);

  const resetUiState = useCallback(() => {
    baseTrackRef.current = null;
    currentTrackRef.current = null;
    setBaseTrack(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
    setIsPlayerOpen(false);
    setPlaylistTracks(LOCAL_TRACKS);
  }, []);

  const releasePlayer = useCallback(() => {
    clearLockScreenForPlayer(playerRef.current);
    clearLockScreenForPlayer(activeNativePlayer);
    listenerRef.current?.remove();
    listenerRef.current = null;
    playerRef.current = null;
    releaseActiveNativePlayer();
  }, []);

  const syncFromCatalog = useCallback((tracks) => {
    const trackId = baseTrackRef.current?.id;
    if (!trackId || !tracks?.length) return;

    const fresh = tracks.find((item) => item.id === trackId);
    if (!fresh) return;

    const mergedBase = { ...baseTrackRef.current, ...fresh };
    baseTrackRef.current = mergedBase;
    setBaseTrack(mergedBase);

    const userVersion = currentTrackRef.current?.userVersion ?? null;
    const displayTrack = buildPlaybackTrack(mergedBase, userVersion);
    currentTrackRef.current = displayTrack;
    setCurrentTrack(displayTrack);

    const byId = Object.fromEntries(tracks.map((item) => [item.id, item]));
    playlistRef.current = (playlistRef.current || []).map((item) =>
      byId[item.id] ? { ...item, ...byId[item.id] } : item
    );

    const player = playerRef.current ?? activeNativePlayer;
    syncMediaSession(player, displayTrack);
  }, []);

  const playTrackInternalRef = useRef(null);

  const handleStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) return;

    setPositionMillis(Math.round(status.currentTime * 1000));
    setDurationMillis(Math.round(status.duration * 1000));
    setIsPlaying(status.playing);

    if (
      supportsMediaSessionControls() &&
      status.duration > 0 &&
      !mediaSessionReadyRef.current
    ) {
      const player = playerRef.current ?? activeNativePlayer;
      const track = currentTrackRef.current;
      if (player && track && lockScreenPlayer === player) {
        mediaSessionReadyRef.current = true;
        refreshMediaSessionMetadata(player, track).catch(() => {});
      }
    }

    if (status.didJustFinish && !advancingRef.current) {
      advancingRef.current = true;
      const playlist = playlistRef.current;
      const trackId = getBaseTrackId(currentTrackRef.current);
      const index = playlist.findIndex((item) => item.id === trackId);
      const currentBase =
        index >= 0 ? playlist[index] : baseTrackRef.current;
      const repeat = repeatModeRef.current;

      const finishAdvance = () => {
        advancingRef.current = false;
      };

      if (repeat === 'one' && currentBase) {
        playTrackInternalRef
          .current?.(currentBase, playlist, null, 0)
          .finally(finishAdvance);
        return;
      }

      const nextTrack = index >= 0 ? playlist[index + 1] : null;

      if (nextTrack) {
        playTrackInternalRef
          .current?.(nextTrack, playlist, null)
          .finally(finishAdvance);
      } else if (repeat === 'all' && playlist.length > 0) {
        playTrackInternalRef
          .current?.(playlist[0], playlist, null)
          .finally(finishAdvance);
      } else {
        setIsPlaying(false);
        setPositionMillis(0);
        finishAdvance();
      }
    }
  }, []);

  const playTrackInternal = useCallback(
    async (
      baseTrack,
      playlist = LOCAL_TRACKS,
      userVersion = null,
      startPositionMs = 0
    ) => {
      releasePlayer();
      playlistRef.current = playlist;
      setPlaylistTracks(playlist);
      baseTrackRef.current = baseTrack;
      setBaseTrack(baseTrack);

      const displayTrack = buildPlaybackTrack(baseTrack, userVersion);
      currentTrackRef.current = displayTrack;
      setCurrentTrack(displayTrack);
      setPositionMillis(0);
      setDurationMillis(0);

      if (!userVersion) {
        pushRecentTrackId(baseTrack.id).catch(() => {});
      }

      if (userVersion?.type === 'video') {
        return;
      }

      const source =
        displayTrack.playbackKind === 'bundled'
          ? baseTrack.file
          : displayTrack.playbackKind === 'offline'
            ? {
                uri:
                  baseTrack.offlineUri ||
                  baseTrack.localLibraryUri ||
                  displayTrack.remoteUri,
              }
            : { uri: displayTrack.remoteUri };

      if (
        displayTrack.playbackKind === 'offline' &&
        !(baseTrack.offlineUri || baseTrack.localLibraryUri || displayTrack.remoteUri)
      ) {
        console.warn('[player] missing local audio uri', baseTrack?.id);
        return;
      }
      if (displayTrack.playbackKind === 'bundled' && !baseTrack.file) {
        console.warn('[player] missing bundled audio file', baseTrack?.id);
        return;
      }

      mediaSessionReadyRef.current = false;

      const player = createAudioPlayer(source, {
        updateInterval: 500,
        keepAudioSessionActive: Platform.OS === 'ios',
      });
      const listener = player.addListener(
        'playbackStatusUpdate',
        handleStatusUpdate
      );

      activeNativePlayer = player;
      activeNativeListener = listener;
      playerRef.current = player;
      listenerRef.current = listener;

      await syncMediaSession(player, displayTrack);

      player.volume = volumeRef.current;
      player.play();
      setIsPlaying(true);

      if (startPositionMs > 0) {
        await player.seekTo(startPositionMs / 1000);
        setPositionMillis(startPositionMs);
      }

      if (Platform.OS === 'ios') {
        await syncMediaSession(player, displayTrack);
      }
    },
    [releasePlayer, handleStatusUpdate]
  );

  playTrackInternalRef.current = playTrackInternal;

  const playTrack = useCallback(
    async (track, playlist = LOCAL_TRACKS) => {
      try {
        await playTrackInternal(track, playlist, null);
      } catch (error) {
        console.warn('[player] playTrack failed', error);
      }
    },
    [playTrackInternal]
  );

  const playUserVersion = useCallback(
    async (baseTrack, version) => {
      if (version?.type === 'video') return;
      try {
        await playTrackInternal(baseTrack, playlistRef.current, version);
      } catch (error) {
        console.warn('[player] playUserVersion failed', error);
      }
    },
    [playTrackInternal]
  );

  const getPlayer = useCallback(() => playerRef.current ?? activeNativePlayer, []);

  const applyVolume = useCallback((nextVolume) => {
    if (currentTrackRef.current?.playbackKind === 'remote-video') return;
    const player = getPlayer();
    if (!player) return;
    try {
      player.volume = nextVolume;
    } catch {
      // ignore
    }
  }, [getPlayer]);

  const setVolume = useCallback(
    (nextVolume, { persist = true } = {}) => {
      const clamped = Math.max(0, Math.min(1, nextVolume));
      volumeRef.current = clamped;
      setVolumeState(clamped);
      applyVolume(clamped);
      if (!persist) return;
      loadAppPreferences()
        .then((prefs) => saveAppPreferences({ ...prefs, playbackVolume: clamped }))
        .catch(() => {});
    },
    [applyVolume]
  );

  const isVideoPlayback = currentTrack?.playbackKind === 'remote-video';

  const togglePlay = useCallback(() => {
    if (isVideoPlayback) {
      setIsPlaying((value) => !value);
      return;
    }

    const player = getPlayer();
    if (!player) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }

    if (Platform.OS === 'ios' && lockScreenPlayer === player) {
      refreshMediaSessionMetadata(player, currentTrackRef.current).catch(() => {});
    }
  }, [getPlayer, isVideoPlayback]);

  const seekTo = useCallback(
    async (millis) => {
      if (isVideoPlayback) return;
      const player = getPlayer();
      if (!player) return;
      const ms = Math.max(0, millis);
      await player.seekTo(ms / 1000);
      setPositionMillis(ms);
    },
    [getPlayer, isVideoPlayback]
  );

  const setVideoProgress = useCallback((position, duration) => {
    setPositionMillis(position);
    if (duration > 0) setDurationMillis(duration);
  }, []);

  const playNext = useCallback(async () => {
    const playlist = playlistRef.current;
    const trackId = getBaseTrackId(currentTrackRef.current);
    if (!trackId) return;

    const index = playlist.findIndex((item) => item.id === trackId);
    let nextTrack = index >= 0 ? playlist[index + 1] : null;
    if (!nextTrack && repeatModeRef.current === 'all' && playlist.length > 0) {
      nextTrack = playlist[0];
    }
    if (nextTrack) {
      await playTrackInternal(nextTrack, playlist, null);
    }
  }, [playTrackInternal]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => {
      const index = REPEAT_MODES.indexOf(mode);
      const next = REPEAT_MODES[(index + 1) % REPEAT_MODES.length];
      repeatModeRef.current = next;
      return next;
    });
  }, []);

  const playPrevious = useCallback(async () => {
    const playlist = playlistRef.current;
    const trackId = getBaseTrackId(currentTrackRef.current);
    if (!trackId) return;

    if (!isVideoPlayback && positionMillis > 3000) {
      await seekTo(0);
      return;
    }

    const index = playlist.findIndex((item) => item.id === trackId);
    const prevTrack = index > 0 ? playlist[index - 1] : null;
    if (prevTrack) {
      await playTrackInternal(prevTrack, playlist, null);
    } else {
      await seekTo(0);
      setPositionMillis(0);
    }
  }, [positionMillis, seekTo, playTrackInternal, isVideoPlayback]);

  const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
  const closePlayer = useCallback(() => setIsPlayerOpen(false), []);

  const stopPlayer = useCallback(async () => {
    releasePlayer();
    resetUiState();
    await clearPlaybackResume();
  }, [releasePlayer, resetUiState]);

  const resumePlayback = useCallback(
    async ({ trackId, positionMillis, playlistIds }) => {
      const track = findTrackById(trackId);
      if (!track) return false;

      const playlist = resolvePlaylistByIds(playlistIds);
      const startMs = Math.max(0, positionMillis || 0);

      try {
        await playTrackInternal(track, playlist, null, startMs);
        return true;
      } catch (error) {
        console.warn('[player] resumePlayback failed', error);
        return false;
      }
    },
    [playTrackInternal]
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!mounted) return;

      const prefs = await loadAppPreferences();
      const savedVolume =
        typeof prefs.playbackVolume === 'number' ? prefs.playbackVolume : 1;
      const clamped = Math.max(0, Math.min(1, savedVolume));
      volumeRef.current = clamped;
      setVolumeState(clamped);

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => subscribeCatalogTracks(syncFromCatalog), [syncFromCatalog]);

  useEffect(() => {
    if (currentTrack?.playbackKind === 'remote-video') return;
    if (currentTrack && !getPlayer()) {
      resetUiState();
    }
  }, [currentTrack, getPlayer, resetUiState]);

  useEffect(() => {
    if (!baseTrack?.id || isVideoPlayback) return undefined;

    const saveResume = () => {
      const position = positionMillis;
      const duration = durationMillis;
      if (position < 3000) return;
      if (duration > 0 && position >= duration - 5000) return;

      const playlistIds = (playlistRef.current || LOCAL_TRACKS).map(
        (item) => item.id
      );

      savePlaybackResume({
        trackId: baseTrack.id,
        positionMillis: position,
        durationMillis: duration,
        playlistIds,
      }).catch(() => {});
    };

    const timer = setInterval(saveResume, 4000);
    return () => clearInterval(timer);
  }, [
    baseTrack?.id,
    positionMillis,
    durationMillis,
    isVideoPlayback,
  ]);

  const playlistIndex = useMemo(() => {
    if (!baseTrack?.id || !playlistTracks.length) return -1;
    return playlistTracks.findIndex((item) => item.id === baseTrack.id);
  }, [baseTrack?.id, playlistTracks]);

  const previousTracks = useMemo(() => {
    if (playlistIndex <= 0) return [];
    return playlistTracks.slice(Math.max(0, playlistIndex - 12), playlistIndex);
  }, [playlistIndex, playlistTracks]);

  const upcomingTracks = useMemo(() => {
    if (!baseTrack?.id || !playlistTracks.length) return [];

    const tail =
      playlistIndex >= 0
        ? playlistTracks.slice(playlistIndex + 1)
        : playlistTracks.filter((item) => item.id !== baseTrack.id);

    return tail.slice(0, 24);
  }, [baseTrack?.id, playlistIndex, playlistTracks]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        baseTrack,
        playlistTracks,
        previousTracks,
        upcomingTracks,
        isPlaying,
        positionMillis,
        durationMillis,
        isPlayerOpen,
        isVideoPlayback,
        playTrack,
        playUserVersion,
        togglePlay,
        seekTo,
        setVideoProgress,
        playNext,
        playPrevious,
        repeatMode,
        cycleRepeatMode,
        volume,
        setVolume,
        openPlayer,
        closePlayer,
        stopPlayer,
        resumePlayback,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer используется вне PlayerProvider');
  }
  return context;
}
