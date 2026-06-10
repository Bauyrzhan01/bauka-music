import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '../components/BottomTabBar';
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

  const handleNavigate = (tab, preset) => {
    if (tab === 'Favorites') {
      setAlbumsOverlay(false);
      setFavoritesOverlay(true);
      return;
    }
    if (tab === 'Albums') {
      setFavoritesOverlay(false);
      setMyMusicOverlay(false);
      setAlbumsOverlay(true);
      return;
    }
    if (tab === 'MyMusic') {
      setFavoritesOverlay(false);
      setAlbumsOverlay(false);
      setEditTrackId(null);
      setMyMusicOverlay(true);
      return;
    }
    if (tab === 'Author' && preset?.authorId) {
      setFavoritesOverlay(false);
      setUserOverlay(null);
      setAuthorOverlay(preset);
      return;
    }
    if (preset) {
      setSearchPreset(preset);
    }
    setActiveTab(tab);
  };

  const openFavorites = () => setFavoritesOverlay(true);

  const openUserReelsProfile = (user) => {
    setFavoritesOverlay(false);
    setAlbumsOverlay(false);
    setAuthorOverlay(null);
    setUserOverlay(user);
  };

  const handleTabPress = (tab) => {
    clearAllOverlays();
    if (tab !== 'Search') {
      setSearchPreset(null);
    }
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
        />
      </View>
      <View
        style={[styles.tabPage, activeTab !== 'Profile' && styles.tabPageHidden]}
        pointerEvents={activeTab === 'Profile' ? 'auto' : 'none'}
      >
        <ProfileScreen
          tabFocusKey={tabFocusKey}
          onOpenFavorites={openFavorites}
          onNavigate={handleNavigate}
          onOpenMyMusic={() => handleNavigate('MyMusic')}
          onEditTrack={(id) => {
            setMyMusicOverlay(false);
            openEditTrack(id);
          }}
          onOpenKaraoke={(id) => {
            setMyMusicOverlay(false);
            openKaraoke(id);
          }}
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
              onBack={() => setMyMusicOverlay(false)}
              onEditTrack={(id) => openEditTrack(id)}
              onOpenKaraoke={(id) => openKaraoke(id)}
            />
          ) : favoritesOverlay ? (
            <FavoritesScreen onBack={() => setFavoritesOverlay(false)} />
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
        <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
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
    backgroundColor: '#fff',
  },
  screen: {
    flex: 1,
  },
  tabBarWrap: {
    backgroundColor: '#fff',
  },
  tabPage: {
    flex: 1,
  },
  tabPageHidden: {
    display: 'none',
  },
});
