import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadSavedAlbums, saveSavedAlbums } from '../storage/albumsStorage';
import { resolveAuthorAvatarUrl } from '../utils/resolveServerMediaUrl';

const AlbumsContext = createContext(null);

function buildAlbumFromAuthor(author) {
  const tracks = author?.tracks ?? [];
  return {
    id: `album-${author.id}`,
    authorId: author.id,
    authorName: author.name || 'Автор',
    authorAvatarUrl: resolveAuthorAvatarUrl(author) || null,
    title: author.name || 'Альбом',
    trackIds: tracks.map((t) => t.id),
    trackCount: tracks.length,
    addedAt: Date.now(),
  };
}

export function AlbumsProvider({ children }) {
  const [albums, setAlbums] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSavedAlbums().then((list) => {
      setAlbums(list);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next) => {
    setAlbums(next);
    await saveSavedAlbums(next);
  }, []);

  const hasAlbum = useCallback(
    (authorId) => albums.some((a) => a.authorId === authorId),
    [albums]
  );

  const addAlbumFromAuthor = useCallback(
    async (author) => {
      if (!author?.id) return { ok: false, error: 'Нет данных автора' };
      if (hasAlbum(author.id)) {
        return { ok: false, error: 'Альбом уже в коллекции' };
      }
      const entry = buildAlbumFromAuthor(author);
      const next = [entry, ...albums.filter((a) => a.authorId !== author.id)];
      await persist(next);
      return { ok: true, album: entry };
    },
    [albums, hasAlbum, persist]
  );

  const removeAlbum = useCallback(
    async (authorId) => {
      const next = albums.filter((a) => a.authorId !== authorId);
      await persist(next);
      return { ok: true };
    },
    [albums, persist]
  );

  const albumCount = albums.length;

  const value = useMemo(
    () => ({
      albums,
      albumCount,
      ready,
      hasAlbum,
      addAlbumFromAuthor,
      removeAlbum,
    }),
    [albums, albumCount, ready, hasAlbum, addAlbumFromAuthor, removeAlbum]
  );

  return (
    <AlbumsContext.Provider value={value}>{children}</AlbumsContext.Provider>
  );
}

export function useAlbums() {
  const ctx = useContext(AlbumsContext);
  if (!ctx) {
    throw new Error('useAlbums используется вне AlbumsProvider');
  }
  return ctx;
}
