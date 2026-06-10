import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  loadAppPreferences,
  setHideBundledTracks as persistHideBundled,
} from '../storage/appPreferences';

const AppPreferencesContext = createContext(null);

export function AppPreferencesProvider({ children }) {
  const [hideBundledTracks, setHideBundledTracksState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAppPreferences().then((prefs) => {
      setHideBundledTracksState(!!prefs.hideBundledTracks);
      setReady(true);
    });
  }, []);

  const setHideBundledTracks = useCallback(async (value) => {
    const prefs = await persistHideBundled(value);
    setHideBundledTracksState(!!prefs.hideBundledTracks);
  }, []);

  return (
    <AppPreferencesContext.Provider
      value={{
        ready,
        hideBundledTracks,
        setHideBundledTracks,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error('useAppPreferences используется вне AppPreferencesProvider');
  }
  return context;
}
