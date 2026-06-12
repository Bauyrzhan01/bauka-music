import { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useOffline } from '../context/OfflineContext';
import HomeHeader from '../components/HomeHeader';
import MyWaveSection from '../components/home/MyWaveSection';
import HomeFeaturedCarouselSection from '../components/home/HomeFeaturedCarouselSection';
import HomeForYouSection from '../components/home/HomeForYouSection';
import HomeMiniPlayersSection from '../components/home/HomeMiniPlayersSection';
import HomeTop10Section from '../components/home/HomeTop10Section';
import HomeTrendsSection from '../components/home/HomeTrendsSection';
import HomeReelsSection from '../components/home/HomeReelsSection';
import MoreFromAuthorSection from '../components/home/MoreFromAuthorSection';

export default function MainScreen({ onNavigate }) {
  const { refreshing, refreshCatalog } = useMusicCatalog();
  const { refreshOffline } = useOffline();
  const [featuredAuthor, setFeaturedAuthor] = useState(null);

  const handleRefresh = async () => {
    await refreshCatalog();
    await refreshOffline();
  };

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        <MyWaveSection dark />
        <HomeTrendsSection onAuthorPress={handleAuthorPress} />
        <HomeReelsSection />
        <HomeForYouSection />
        <HomeMiniPlayersSection />
        <HomeTop10Section />
        <MoreFromAuthorSection
          author={featuredAuthor}
          onOpenProfile={handleOpenAuthorProfile}
        />
        <HomeFeaturedCarouselSection />
      </ScrollView>

      <HomeHeader
        overlay
        dark
        onAdd={() => onNavigate?.('MyMusic')}
        onSearch={() => onNavigate?.('Search')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
    zIndex: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
