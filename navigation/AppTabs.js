import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DockTabBar from '../components/navigation/DockTabBar';
import MiniPlayer from '../components/player/MiniPlayer';
import MainScreen from '../screens/MainScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlayerScreen from '../screens/PlayerScreen';
import ListeningHeartbeat from '../components/player/ListeningHeartbeat';
import AuthorProfileScreen from '../screens/AuthorProfileScreen';
import UserReelsProfileScreen from '../screens/UserReelsProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AlbumsScreen from '../screens/AlbumsScreen';
import MyMusicScreen from '../screens/MyMusicScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditLocalTrackScreen from '../screens/EditLocalTrackScreen';
import LocalKaraokeScreen from '../screens/LocalKaraokeScreen';
import { ReelsNavProvider } from '../context/ReelsNavContext';
import { usePlayer } from '../context/PlayerContext';

export default function AppTabs() {
  const [activeTab, setActiveTab] = useState('Main');
  const [searchPreset, setSearchPreset] = useState(null);
  const [authorOverlay, setAuthorOverlay] = useState(null);
  const [favoritesOverlay, setFavoritesOverlay] = useState(false);
  const [albumsOverlay, setAlbumsOverlay] = useState(false);
  const [userOverlay, setUserOverlay] = useState(null);
  const [myMusicOverlay, setMyMusicOverlay] = useState(false);
  const [settingsOverlay, setSettingsOverlay] = useState(false);
  const [editTrackId, setEditTrackId] = useState(null);
  const [karaokeTrackId, setKaraokeTrackId] = useState(null);
  const [tabFocusKey, setTabFocusKey] = useState(0);
  const { currentTrack, closePlayer } = usePlayer();

  const clearAllOverlays = () => {
    setAuthorOverlay(null);
    setFavoritesOverlay(false);
    setAlbumsOverlay(false);
    setUserOverlay(null);
    setMyMusicOverlay(false);
    setSettingsOverlay(false);
    setEditTrackId(null);
    setKaraokeTrackId(null);
  };

  const openKaraoke = (id) => {
    setEditTrackId(null);
    setKaraokeTrackId(id);
  };

  const openEditTrack = (id) => {
    setKaraokeTrackId(null);
    setEditTrackId(id);
  };

  const closeFavorites = () => {
    setFavoritesOverlay(false);
    setActiveTab('Main');
  };

  const closeMyMusic = () => {
    setMyMusicOverlay(false);
    setActiveTab('Main');
  };

  const closeSettings = () => {
    setSettingsOverlay(false);
    setActiveTab('Profile');
  };

  const openSettings = () => {
    clearAllOverlays();
    setSettingsOverlay(true);
    setActiveTab('Settings');
  };

  const handleNavigate = (tab, preset) => {
    if (tab === 'Favorites') {
      clearAllOverlays();
      setFavoritesOverlay(true);
      setActiveTab('Favorites');
      return;
    }
    if (tab === 'Albums') {
      clearAllOverlays();
      setAlbumsOverlay(true);
      setActiveTab('Main');
      return;
    }
    if (tab === 'MyMusic') {
      clearAllOverlays();
      setMyMusicOverlay(true);
      setActiveTab('MyMusic');
      return;
    }
    if (tab === 'Author' && preset?.authorId) {
      setFavoritesOverlay(false);
      setAlbumsOverlay(false);
      setMyMusicOverlay(false);
      setUserOverlay(null);
      setAuthorOverlay(preset);
      return;
    }
    if (tab === 'Search') {
      clearAllOverlays();
      if (preset) {
        setSearchPreset(preset);
      }
      setActiveTab('Search');
      return;
    }
    if (preset) {
      setSearchPreset(preset);
    }
    clearAllOverlays();
    setActiveTab(tab);
  };

  const openFavorites = () => {
    clearAllOverlays();
    setFavoritesOverlay(true);
    setActiveTab('Favorites');
  };

  const openUserReelsProfile = (user) => {
    setFavoritesOverlay(false);
    setAlbumsOverlay(false);
    setAuthorOverlay(null);
    setUserOverlay(user);
  };

  const handleTabPress = (tab) => {
    if (tab === 'MyMusic') {
      if (myMusicOverlay && activeTab === 'MyMusic') {
        closeMyMusic();
        return;
      }
      clearAllOverlays();
      setMyMusicOverlay(true);
      setActiveTab('MyMusic');
      return;
    }
    if (tab === 'Favorites') {
      if (favoritesOverlay && activeTab === 'Favorites') {
        closeFavorites();
        return;
      }
      clearAllOverlays();
      setFavoritesOverlay(true);
      setActiveTab('Favorites');
      return;
    }
    if (tab === 'Main') {
      const onMain =
        activeTab === 'Main' &&
        !favoritesOverlay &&
        !myMusicOverlay &&
        !albumsOverlay &&
        !authorOverlay &&
        !userOverlay &&
        !editTrackId &&
        !karaokeTrackId;
      if (onMain) return;
      clearAllOverlays();
      setSearchPreset(null);
      setActiveTab('Main');
      return;
    }
    clearAllOverlays();
    setSearchPreset(null);
    setTabFocusKey((key) => key + 1);
    setActiveTab(tab);
  };

  const renderTabScreens = () => (
    <>
      <View
        style={[styles.tabPage, activeTab !== 'Main' && styles.tabPageHidden]}
        pointerEvents={activeTab === 'Main' ? 'auto' : 'none'}
      >
        <MainScreen onNavigate={handleNavigate} />
      </View>
      <View
        style={[styles.tabPage, activeTab !== 'Search' && styles.tabPageHidden]}
        pointerEvents={activeTab === 'Search' ? 'auto' : 'none'}
      >
        <SearchScreen
          searchPreset={searchPreset}
          onClearPreset={() => setSearchPreset(null)}
          onBack={() => {
            setSearchPreset(null);
            setActiveTab('Main');
          }}
        />
      </View>
      <View
        style={[styles.tabPage, activeTab !== 'Profile' && styles.tabPageHidden]}
        pointerEvents={activeTab === 'Profile' ? 'auto' : 'none'}
      >
        <ProfileScreen
          tabFocusKey={tabFocusKey}
          onOpenFavorites={openFavorites}
          onOpenSettings={openSettings}
          onNavigate={handleNavigate}
          onOpenMyMusic={() => handleNavigate('MyMusic')}
        />
      </View>
    </>
  );

  return (
    <ReelsNavProvider openUserProfile={openUserReelsProfile}>
      <View style={styles.container}>
        <SafeAreaView style={styles.screen} edges={['top']}>
          {karaokeTrackId ? (
            <LocalKaraokeScreen
              trackId={karaokeTrackId}
              onBack={() => setKaraokeTrackId(null)}
              onOpenEdit={(id) => openEditTrack(id)}
            />
          ) : editTrackId ? (
            <EditLocalTrackScreen
              trackId={editTrackId}
              onBack={() => setEditTrackId(null)}
              onOpenKaraoke={(id) => openKaraoke(id)}
            />
          ) : myMusicOverlay ? (
            <MyMusicScreen
              onBack={closeMyMusic}
              onEditTrack={(id) => openEditTrack(id)}
              onOpenKaraoke={(id) => openKaraoke(id)}
            />
          ) : favoritesOverlay ? (
            <FavoritesScreen onBack={closeFavorites} />
          ) : settingsOverlay ? (
            <SettingsScreen
              onBack={closeSettings}
              onNavigate={handleNavigate}
              onEditTrack={(id) => {
                setSettingsOverlay(false);
                openEditTrack(id);
              }}
              onOpenKaraoke={(id) => {
                setSettingsOverlay(false);
                openKaraoke(id);
              }}
            />
          ) : albumsOverlay ? (
            <AlbumsScreen
              onBack={() => setAlbumsOverlay(false)}
              onOpenAuthor={(preset) => {
                setAlbumsOverlay(false);
                handleNavigate('Author', preset);
              }}
            />
          ) : userOverlay ? (
            <UserReelsProfileScreen
              userEmail={userOverlay.userEmail}
              userName={userOverlay.userName}
              userAvatarUrl={userOverlay.userAvatarUrl}
              onBack={() => setUserOverlay(null)}
            />
          ) : authorOverlay ? (
            <AuthorProfileScreen
              authorId={authorOverlay.authorId}
              authorName={authorOverlay.authorName}
              onBack={() => setAuthorOverlay(null)}
            />
          ) : (
            renderTabScreens()
          )}
        </SafeAreaView>

      <ListeningHeartbeat screen={activeTab} />
      {currentTrack ? <MiniPlayer /> : null}

      <SafeAreaView edges={['bottom']} style={styles.tabBarWrap}>
        <View style={styles.tabBarFull}>
          <DockTabBar activeTab={activeTab} onTabPress={handleTabPress} />
        </View>
      </SafeAreaView>

        <PlayerScreen
          onOpenAuthorProfile={(preset) => {
            closePlayer();
            handleNavigate('Author', preset);
          }}
        />
      </View>
    </ReelsNavProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBarWrap: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  tabBarFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  tabPage: {
    flex: 1,
  },
  tabPageHidden: {
    display: 'none',
  },
});
