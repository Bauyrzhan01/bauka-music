import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createBanner,
  deleteBannerApi,
  fetchBanners,
  setBannerActive,
  updateBannerApi,
} from '../api/bannersApi';

const BannersContext = createContext(null);
const POLL_MS = 3000;

export function BannersProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBanners = useCallback(async () => {
    try {
      const data = await fetchBanners();
      setBanners(data);
    } catch {
      // сервер не запущен — оставляем текущий список
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBanners();
    const interval = setInterval(refreshBanners, POLL_MS);
    return () => clearInterval(interval);
  }, [refreshBanners]);

  const activeBanners = useMemo(
    () => banners.filter((banner) => banner.active && banner.imageUri),
    [banners],
  );

  const addBanner = async (banner) => {
    await createBanner(banner.imageUri, banner.active);
    await refreshBanners();
  };

  const updateBanner = async (id, patch) => {
    await updateBannerApi(id, patch);
    await refreshBanners();
  };

  const deleteBanner = async (id) => {
    await deleteBannerApi(id);
    await refreshBanners();
    return true;
  };

  const launchBanner = async (id) => {
    await setBannerActive(id, true);
    await refreshBanners();
  };

  const stopBanner = async (id) => {
    await setBannerActive(id, false);
    await refreshBanners();
  };

  return (
    <BannersContext.Provider
      value={{
        banners,
        activeBanners,
        isLoading,
        addBanner,
        updateBanner,
        deleteBanner,
        launchBanner,
        stopBanner,
        refreshBanners,
      }}
    >
      {children}
    </BannersContext.Provider>
  );
}

export function useBanners() {
  const context = useContext(BannersContext);
  if (!context) {
    throw new Error('useBanners используется вне BannersProvider');
  }
  return context;
}
