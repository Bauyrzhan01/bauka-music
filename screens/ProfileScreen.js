import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useMyLibrary } from '../context/MyLibraryContext';
import { useFavorites } from '../context/FavoritesContext';
import { useOffline } from '../context/OfflineContext';
import { loadRecentTrackIds } from '../storage/recentListensStorage';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStatsSection from '../components/profile/ProfileStatsSection';
import ProfileListeningStats from '../components/profile/ProfileListeningStats';
import { isStandaloneApp } from '../constants/standalone';
import ProfileApiBanner from '../components/profile/ProfileApiBanner';
import ProfileMyReelsSection from '../components/profile/ProfileMyReelsSection';
import ProfileRecentSection from '../components/profile/ProfileRecentSection';
import ProfileOfflineSection from '../components/profile/ProfileOfflineSection';
import FavoritesProfileSection from '../components/profile/FavoritesProfileSection';
import ProfileMenuRow from '../components/profile/ProfileMenuRow';
import SettingsScreen from './SettingsScreen';
import EditProfileScreen from './EditProfileScreen';

export default function ProfileScreen({
  tabFocusKey = 0,
  onOpenFavorites,
  onNavigate,
  onOpenMyMusic,
  onEditTrack,
  onOpenKaraoke,
}) {
  const { user, logout } = useAuth();
  const { entries: libraryEntries } = useMyLibrary();
  const { favoriteCount } = useFavorites();
  const { offlineTracks } = useOffline();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [recentCount, setRecentCount] = useState(0);
  const [reelsCount, setReelsCount] = useState(0);

  const handleReelsCount = useCallback((count) => {
    setReelsCount(count);
  }, []);

  const refreshRecentCount = useCallback(async () => {
    const ids = await loadRecentTrackIds();
    setRecentCount(ids.length);
  }, []);

  useEffect(() => {
    refreshRecentCount();
  }, [refreshRecentCount, favoriteCount, offlineTracks.length]);

  useEffect(() => {
    setShowSettings(false);
    setShowEditProfile(false);
  }, [tabFocusKey]);

  if (showEditProfile) {
    return <EditProfileScreen onBack={() => setShowEditProfile(false)} />;
  }

  if (showSettings) {
    return (
      <SettingsScreen
        onBack={() => setShowSettings(false)}
        onEditTrack={onEditTrack}
        onOpenKaraoke={onOpenKaraoke}
        onNavigate={onNavigate}
      />
    );
  }

  const handleResetProfile = () => {
    Alert.alert(
      'Сбросить профиль?',
      'Имя и аватар вернутся к значениям по умолчанию. Музыка на телефоне не удалится.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.topBarBtn}
          onPress={() => setShowEditProfile(true)}
          accessibilityLabel="Редактировать профиль"
        >
          <Ionicons name="create-outline" size={24} color="#000" />
        </Pressable>
        <Pressable
          style={styles.topBarBtn}
          onPress={() => setShowSettings(true)}
          accessibilityLabel="Настройки"
        >
          <Ionicons name="settings-outline" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        onScrollBeginDrag={refreshRecentCount}
      >
        <ProfileHeader
          name={user?.name}
          email={user?.isLocal ? null : user?.email}
          reelsCount={reelsCount}
          onEditProfile={() => setShowEditProfile(true)}
        />

        {isStandaloneApp() ? null : (
          <ProfileApiBanner onOpenSettings={() => setShowSettings(true)} />
        )}

        <ProfileStatsSection
          favoritesCount={favoriteCount}
          offlineCount={offlineTracks.length}
          recentCount={recentCount}
          reelsCount={reelsCount}
        />

        <ProfileListeningStats />

        <ProfileMyReelsSection
          onCountChange={handleReelsCount}
          onOpenMain={() => onNavigate?.('Main')}
        />

        <ProfileRecentSection />
        <FavoritesProfileSection onOpenAll={onOpenFavorites} />
        {isStandaloneApp() ? null : <ProfileOfflineSection />}

        <View style={styles.menu}>
          <Text style={styles.menuTitle}>Действия</Text>
          <ProfileMenuRow
            icon="person-outline"
            label="Редактировать профиль"
            subtitle="Имя, фото и описание"
            onPress={() => setShowEditProfile(true)}
          />
          <ProfileMenuRow
            icon="musical-notes-outline"
            label="Моя музыка"
            subtitle={
              libraryEntries.length > 0
                ? `${libraryEntries.length} треков на телефоне`
                : 'Добавить MP3, текст, клип'
            }
            onPress={onOpenMyMusic}
          />
          <ProfileMenuRow
            icon="search-outline"
            label="Поиск"
            subtitle="Треки, авторы, плейлисты"
            onPress={() => onNavigate?.('Search')}
          />
          <ProfileMenuRow
            icon="heart-outline"
            label="Все избранное"
            subtitle={
              favoriteCount > 0
                ? `${favoriteCount} треков`
                : 'Пока пусто'
            }
            onPress={onOpenFavorites}
          />
          <ProfileMenuRow
            icon="settings-outline"
            label="Настройки"
            subtitle="Админка, библиотека, локальный режим"
            onPress={() => setShowSettings(true)}
          />
          <ProfileMenuRow
            icon="refresh-outline"
            label="Сбросить профиль"
            onPress={handleResetProfile}
            showChevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarBtn: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  menu: {
    marginTop: 16,
    borderTopWidth: 8,
    borderTopColor: '#f4f4f5',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
