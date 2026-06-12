import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { isStandaloneApp } from '../constants/standalone';
import { fetchMusicCatalog } from '../api/musicApi';
import { ensureApiBaseOverrideLoaded } from '../constants/api';
import { mergeCatalogTracks } from '../utils/mergeCatalogTracks';
import { enrichTracksWithCovers } from '../utils/trackCoverUrl';
import {
  authorIdFromName,
  buildAuthorsFromTracks,
  mergeStoredAuthors,
} from '../utils/localAuthors';
import { setCatalogTracks } from '../utils/catalogTrackRegistry';
import { LOCAL_TRACKS } from '../data/localTracks';
import {
  loadLocalAuthors,
  saveLocalAuthors,
} from '../storage/localAuthorsStorage';
import { useMyLibrary } from './MyLibraryContext';
import { useAppPreferences } from './AppPreferencesContext';
import { generatePlaceholderImageFile } from '../utils/generatePlaceholderImage';

const MusicCatalogContext = createContext(null);

export function MusicCatalogProvider({ children }) {
  const { catalogTracks: libraryTracks, refreshLibrary } = useMyLibrary();
  const { hideBundledTracks } = useAppPreferences();
  const standalone = isStandaloneApp();
  const [authors, setAuthors] = useState([]);
  const [localAuthors, setLocalAuthors] = useState([]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const tracks = useMemo(() => {
    const includeBundled = standalone || !hideBundledTracks;

    if (!includeBundled) {
      return libraryTracks;
    }

    const base = standalone
      ? enrichTracksWithCovers(LOCAL_TRACKS)
      : remoteTracks.length
        ? mergeCatalogTracks(remoteTracks)
        : enrichTracksWithCovers(LOCAL_TRACKS);

    if (!libraryTracks.length) return base;

    const libraryIds = new Set(libraryTracks.map((track) => track.id));
    return [
      ...libraryTracks,
      ...base.filter((track) => !libraryIds.has(track.id)),
    ];
  }, [remoteTracks, libraryTracks, hideBundledTracks, standalone]);

  useEffect(() => {
    setCatalogTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    if (!standalone) return;
    loadLocalAuthors().then(setLocalAuthors);
  }, [standalone, libraryTracks]);

  const derivedAuthors = useMemo(() => {
    if (!standalone) return authors;
    return mergeStoredAuthors(buildAuthorsFromTracks(tracks), localAuthors);
  }, [standalone, tracks, authors, localAuthors]);

  const updateLocalAuthor = useCallback(
    async (authorId, patch = {}) => {
      if (!authorId) {
        return { ok: false, error: 'Автор не указан' };
      }

      const list = [...localAuthors];
      let index = list.findIndex((item) => item.id === authorId);
      if (index < 0) {
        index = list.findIndex(
          (item) => authorIdFromName(item.name) === authorId
        );
      }

      if (index < 0) {
        const nameFromId = authorId.startsWith('artist:')
          ? authorId.slice('artist:'.length)
          : patch.name || 'Автор';
        list.push({
          id: authorId,
          name: patch.name || nameFromId,
          bio: patch.bio || '',
          avatarUri: patch.avatarUri ?? null,
          createdAt: new Date().toISOString(),
        });
      } else {
        list[index] = {
          ...list[index],
          ...patch,
        };
      }

      await saveLocalAuthors(list);
      setLocalAuthors(list);

      const updated =
        list.find((item) => item.id === authorId) ||
        list.find((item) => authorIdFromName(item.name) === authorId);

      return { ok: true, author: updated };
    },
    [localAuthors]
  );

  const createLocalAuthor = useCallback(
    async ({ name, bio = '' }) => {
      const trimmedName = String(name || '').trim();
      if (!trimmedName) {
        return { ok: false, error: 'Введите имя автора' };
      }

      const id = authorIdFromName(trimmedName);
      const exists = localAuthors.some(
        (item) => normalizeAuthorName(item.name) === normalizeAuthorName(trimmedName)
      );
      if (exists) {
        return { ok: false, error: 'Автор с таким именем уже есть' };
      }

      const avatarUri = await generatePlaceholderImageFile(trimmedName, {
        subdir: 'author-avatars',
      });
      const next = [
        ...localAuthors,
        {
          id,
          name: trimmedName,
          bio: String(bio || '').trim(),
          avatarUri,
          createdAt: new Date().toISOString(),
        },
      ];
      await saveLocalAuthors(next);
      setLocalAuthors(next);
      return { ok: true, author: next[next.length - 1] };
    },
    [localAuthors]
  );

  const refreshCatalog = useCallback(async () => {
    if (standalone) {
      setRefreshing(true);
      try {
        await refreshLibrary();
        setSyncError(null);
        setLastSyncedAt(Date.now());
      } finally {
        setRefreshing(false);
      }
      return;
    }

    await ensureApiBaseOverrideLoaded();
    setRefreshing(true);
    setSyncError(null);
    try {
      const data = await fetchMusicCatalog();
      setRemoteTracks(data.tracks ?? []);
      setAuthors(data.authors ?? []);
      setLastSyncedAt(Date.now());
    } catch (error) {
      setSyncError(error.message || 'Не удалось обновить');
    } finally {
      setRefreshing(false);
    }
  }, [standalone, refreshLibrary]);

  return (
    <MusicCatalogContext.Provider
      value={{
        tracks,
        authors: derivedAuthors,
        refreshing,
        syncError: standalone ? null : syncError,
        lastSyncedAt,
        refreshCatalog,
        createLocalAuthor,
        updateLocalAuthor,
        localAuthors,
        isStandalone: standalone,
      }}
    >
      {children}
    </MusicCatalogContext.Provider>
  );
}

function normalizeAuthorName(name) {
  return String(name || '')
    .trim()
    .toLowerCase();
}

export function useMusicCatalog() {
  const context = useContext(MusicCatalogContext);
  if (!context) {
    throw new Error('useMusicCatalog используется вне MusicCatalogProvider');
  }
  return context;
}

