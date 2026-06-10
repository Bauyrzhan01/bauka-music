import { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import HomeHeader from '../components/HomeHeader';
import ContinueListeningSection from '../components/home/ContinueListeningSection';
import MyWaveSection from '../components/home/MyWaveSection';
import AuthorRow from '../components/home/AuthorRow';
import MoreFromAuthorSection from '../components/home/MoreFromAuthorSection';
import HomeTracksRow from '../components/home/HomeTracksRow';
import HomeQuickActionsRow from '../components/home/HomeQuickActionsRow';
import NowPlayingSection from '../components/home/NowPlayingSection';
import HomeReelsSection from '../components/home/HomeReelsSection';
import HomeRecommendedSection from '../components/home/HomeRecommendedSection';
import { isStandaloneApp } from '../constants/standalone';
import OfflineTracksSection from '../components/home/OfflineTracksSection';

export default function MainScreen({ onNavigate }) {
  const { user } = useAuth();
  const { refreshing, refreshCatalog } = useMusicCatalog();
  const { refreshOffline } = useOffline();

  const handleRefresh = async () => {
    await refreshCatalog();
    await refreshOffline();
  };
  const [featuredAuthor, setFeaturedAuthor] = useState(null);

  const handleAuthorPress = (author) => {
    setFeaturedAuthor((current) =>
      current?.id === author.id ? null : author
    );
  };

  const handleOpenAuthorProfile = (author) => {
    onNavigate?.('Author', {
      authorId: author.id,
      authorName: author?.name || 'Автор',
    });
  };

  return (
    <View style={styles.container}>
      <HomeHeader
        accountName={user?.name}
        avatarUri={user?.avatarUri}
        avatarAccentColor={user?.avatarAccentColor}
        onProfile={() => onNavigate?.('Profile')}
        onSearch={() => onNavigate?.('Search')}
        onNotifications={() => {}}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ContinueListeningSection />
        <MyWaveSection />
        <NowPlayingSection />
        <HomeQuickActionsRow
          onOpenFavorites={() => onNavigate?.('Favorites')}
          onOpenAlbums={() => onNavigate?.('Albums')}
          onOpenMyMusic={() => onNavigate?.('MyMusic')}
        />
        <HomeReelsSection />
        <AuthorRow
          onAuthorPress={handleAuthorPress}
          selectedAuthorId={featuredAuthor?.id}
        />
        <MoreFromAuthorSection
          author={featuredAuthor}
          onOpenProfile={handleOpenAuthorProfile}
        />
        <HomeRecommendedSection
          featuredAuthor={featuredAuthor}
          onOpenProfile={handleOpenAuthorProfile}
        />
        {isStandaloneApp() ? null : <OfflineTracksSection />}
        <HomeTracksRow />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
