import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useMyLibrary } from '../context/MyLibraryContext';
import { useFavorites } from '../context/FavoritesContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileMenuRow from '../components/profile/ProfileMenuRow';
import EditProfileScreen from './EditProfileScreen';

export default function ProfileScreen({
  tabFocusKey = 0,
  onOpenFavorites,
  onOpenSettings,
  onNavigate,
  onOpenMyMusic,
}) {
  const { user } = useAuth();
  const { entries: libraryEntries } = useMyLibrary();
  const { favoriteCount } = useFavorites();
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    setShowEditProfile(false);
  }, [tabFocusKey]);

  if (showEditProfile) {
    return <EditProfileScreen onBack={() => setShowEditProfile(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Профиль</Text>

        <ProfileHeader
          name={user?.name}
          email={user?.isLocal ? null : user?.email}
          onEditProfile={() => setShowEditProfile(true)}
        />

        <View style={styles.menuCard}>
          <ProfileMenuRow
            icon="person-outline"
            label="Редактировать профиль"
            onPress={() => setShowEditProfile(true)}
          />
          <ProfileMenuRow
            icon="musical-notes-outline"
            label="Моя музыка"
            subtitle={
              libraryEntries.length > 0
                ? `${libraryEntries.length} треков`
                : 'Добавить MP3'
            }
            onPress={onOpenMyMusic}
          />
          <ProfileMenuRow
            icon="heart-outline"
            label="Избранное"
            subtitle={
              favoriteCount > 0 ? `${favoriteCount} треков` : 'Пока пусто'
            }
            onPress={onOpenFavorites}
          />
          <ProfileMenuRow
            icon="search-outline"
            label="Поиск"
            onPress={() => onNavigate?.('Search')}
          />
          <ProfileMenuRow
            icon="settings-outline"
            label="Параметры"
            subtitle="Сервер, библиотека, админка"
            onPress={onOpenSettings}
            showChevron
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuCard: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
});
