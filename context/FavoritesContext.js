import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadFavoriteIds, saveFavoriteIds } from '../storage/favoritesStorage';
import { getFavoriteTracks } from '../utils/getFavoriteTracks';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFavoriteIds().then((ids) => {
      setFavoriteIds(ids);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (ids) => {
    setFavoriteIds(ids);
    await saveFavoriteIds(ids);
  }, []);

  const isFavorite = useCallback(
    (trackId) => !!trackId && favoriteIds.includes(trackId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (trackId) => {
      if (!trackId) return;
      const next = favoriteIds.includes(trackId)
        ? favoriteIds.filter((id) => id !== trackId)
        : [trackId, ...favoriteIds];
      await persist(next);
    },
    [favoriteIds, persist]
  );

  const favoriteTracks = useMemo(
    () => getFavoriteTracks(favoriteIds),
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider
      value={{
        ready,
        favoriteIds,
        favoriteTracks,
        favoriteCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites используется вне FavoritesProvider');
  }
  return context;
}
