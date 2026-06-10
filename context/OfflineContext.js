import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMusicCatalog } from './MusicCatalogContext';
import {
  deleteOfflineAudioFile,
  downloadTrackAudio,
  verifyOfflineFile,
} from '../utils/downloadTrackAudio';
import {
  loadOfflineTracks,
  saveOfflineTracks,
} from '../storage/offlineTracksStorage';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const { tracks } = useMusicCatalog();
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const hydrate = useCallback(async () => {
    const saved = await loadOfflineTracks();
    const verified = [];
    for (const entry of saved) {
      const ok = await verifyOfflineFile(entry.localUri);
      if (ok) verified.push(entry);
    }
    if (verified.length !== saved.length) {
      await saveOfflineTracks(verified);
    }
    setEntries(verified);
    setReady(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const offlineById = useMemo(
    () => Object.fromEntries(entries.map((item) => [item.trackId, item])),
    [entries]
  );

  const isOffline = useCallback(
    (trackId) => !!trackId && !!offlineById[trackId],
    [offlineById]
  );

  const getOfflineUri = useCallback(
    (trackId) => offlineById[trackId]?.localUri ?? null,
    [offlineById]
  );

  const catalogTracks = useMemo(
    () =>
      tracks.map((track) => {
        const cachedUri = getOfflineUri(track.id);
        const libraryUri = track.offlineUri || track.localLibraryUri || null;
        const offlineUri = cachedUri ?? libraryUri;
        return {
          ...track,
          offlineUri,
          isOffline: isOffline(track.id) || !!track.isLocalLibrary,
        };
      }),
    [tracks, getOfflineUri, isOffline]
  );

  const offlineTracks = useMemo(() => {
    const byId = Object.fromEntries(tracks.map((track) => [track.id, track]));
    return entries
      .map((entry) => {
        const track = byId[entry.trackId];
        if (!track) return null;
        return {
          ...track,
          offlineUri: entry.localUri,
          isOffline: true,
        };
      })
      .filter(Boolean);
  }, [entries, tracks]);

  const downloadTrack = useCallback(
    async (track) => {
      if (!track?.id) return;
      setBusyId(track.id);
      try {
        const localUri = await downloadTrackAudio(track);
        const next = [
          {
            trackId: track.id,
            localUri,
            filename: track.filename,
            title: track.title,
            artist: track.artist,
            savedAt: Date.now(),
          },
          ...entries.filter((item) => item.trackId !== track.id),
        ];
        setEntries(next);
        await saveOfflineTracks(next);
      } finally {
        setBusyId(null);
      }
    },
    [entries]
  );

  const removeOffline = useCallback(
    async (trackId) => {
      const entry = offlineById[trackId];
      if (!entry) return;
      await deleteOfflineAudioFile(entry.localUri);
      const next = entries.filter((item) => item.trackId !== trackId);
      setEntries(next);
      await saveOfflineTracks(next);
    },
    [entries, offlineById]
  );

  return (
    <OfflineContext.Provider
      value={{
        ready,
        busyId,
        entries,
        offlineTracks,
        catalogTracks,
        isOffline,
        getOfflineUri,
        downloadTrack,
        removeOffline,
        refreshOffline: hydrate,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline используется вне OfflineProvider');
  }
  return context;
}
