import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ensureApiBaseOverrideLoaded } from './constants/api';
import { isStandaloneApp } from './constants/standalone';
import { PlayerProvider } from './context/PlayerContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AlbumsProvider } from './context/AlbumsContext';
import { MusicCatalogProvider } from './context/MusicCatalogContext';
import { OfflineProvider } from './context/OfflineContext';
import AppTabs from './navigation/AppTabs';
import { MyLibraryProvider } from './context/MyLibraryContext';
import { AppPreferencesProvider } from './context/AppPreferencesContext';
import { HomeEntranceProvider } from './context/HomeEntranceContext';
import WebAdminLoginScreen from './screens/web/WebAdminLoginScreen';
import WebAdminPanel from './screens/web/WebAdminPanel';
import WebAccessDeniedScreen from './screens/web/WebAccessDeniedScreen';

function AppLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#111" />
    </View>
  );
}

function MobileRoot() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <>
      <PlayerProvider>
        <FavoritesProvider>
          <AlbumsProvider>
            <AppPreferencesProvider>
              <MyLibraryProvider>
                <MusicCatalogProvider>
                  <OfflineProvider>
                    <HomeEntranceProvider>
                      <AppTabs />
                    </HomeEntranceProvider>
                  </OfflineProvider>
                </MusicCatalogProvider>
              </MyLibraryProvider>
            </AppPreferencesProvider>
          </AlbumsProvider>
        </FavoritesProvider>
      </PlayerProvider>
      <StatusBar style="auto" />
    </>
  );
}

function WebRoot() {
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  if (!isAuthenticated) {
    return <WebAdminLoginScreen />;
  }

  if (!isAdmin) {
    return <WebAccessDeniedScreen onLogout={logout} />;
  }

  return <WebAdminPanel />;
}

function Root() {
  if (Platform.OS === 'web') {
    return <WebRoot />;
  }
  return <MobileRoot />;
}

function AppLoader({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isStandaloneApp()) {
      setReady(true);
      return;
    }
    ensureApiBaseOverrideLoaded().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <AppLoading />;
  }

  return children;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLoader>
          <Root />
        </AppLoader>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
