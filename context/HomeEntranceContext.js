import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  isHomeEntrancePlayed,
  markHomeEntrancePlayed,
} from '../storage/homeEntranceStorage';

const HomeEntranceContext = createContext({
  ready: false,
  shouldAnimate: false,
});

export function HomeEntranceProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const played = await isHomeEntrancePlayed();
      if (!mounted) return;

      if (!played) {
        setShouldAnimate(true);
        await markHomeEntrancePlayed();
      }

      setReady(true);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <HomeEntranceContext.Provider value={{ ready, shouldAnimate }}>
      {children}
    </HomeEntranceContext.Provider>
  );
}

export function useHomeEntrance() {
  return useContext(HomeEntranceContext);
}
