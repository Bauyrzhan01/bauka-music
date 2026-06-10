import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useMyLibrary } from '../context/MyLibraryContext';
import { MUSIC_CATEGORIES } from '../data/categories';
import ProfileMenuRow from '../components/profile/ProfileMenuRow';
import LocalAdminProfileSection from '../components/admin/LocalAdminProfileSection';
import LocalAdminAuthorsSection from '../components/admin/LocalAdminAuthorsSection';
import LocalAdminKaraokeSection from '../components/admin/LocalAdminKaraokeSection';
import LocalAdminAutomationSection from '../components/admin/LocalAdminAutomationSection';
import LocalAdminMusicSection from '../components/admin/LocalAdminMusicSection';
import { useOsBack } from '../hooks/useOsBack';

const SECTIONS = [
  { id: 'dashboard', icon: 'grid-outline', label: 'Обзор' },
  { id: 'automation', icon: 'flash-outline', label: 'Автоматизация' },
  { id: 'music', icon: 'musical-notes-outline', label: 'Музыка' },
  { id: 'authors', icon: 'people-outline', label: 'Авторы' },
  { id: 'karaoke', icon: 'mic-outline', label: 'Караоке' },
  { id: 'profile', icon: 'person-outline', label: 'Профиль' },
  { id: 'categories', icon: 'albums-outline', label: 'Категории' },
];

export default function LocalAdminScreen({
  onBack,
  onOpenKaraoke,
  onEditTrack,
  onNavigate,
}) {
  useOsBack(onBack);
  const { user } = useAuth();
  const { tracks, authors } = useMusicCatalog();
  const { entries } = useMyLibrary();
  const [section, setSection] = useState('menu');

  const stats = useMemo(
    () => ({
      tracks: entries.length,
      authors: authors.length,
      catalog: tracks.length,
      videos: entries.reduce((sum, e) => sum + (e.videos?.length || 0), 0),
    }),
    [entries, authors, tracks]
  );

  const renderContent = () => {
    switch (section) {
      case 'dashboard':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Локальная библиотека</Text>
            <Text style={styles.sectionHint}>
              Все данные хранятся только на этом телефоне. Сервер не нужен.
            </Text>
            <View style={styles.statsGrid}>
              <StatCard label="Мои треки" value={stats.tracks} icon="musical-notes" />
              <StatCard label="Авторы" value={stats.authors} icon="people" />
              <StatCard label="В каталоге" value={stats.catalog} icon="albums" />
              <StatCard label="Видео" value={stats.videos} icon="videocam" />
            </View>
            <Text style={styles.userLine}>
              Профиль: {user?.name || 'Слушатель'}
            </Text>
            <Text style={styles.sectionHint}>
              Новые треки обрабатываются автоматически: имя из файла, обложка,
              автор, караоке после сохранения текста.
            </Text>
          </View>
        );

      case 'automation':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Автоматизация</Text>
            <LocalAdminAutomationSection />
          </View>
        );

      case 'music':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Музыка</Text>
            <LocalAdminMusicSection
              entries={entries}
              onEditTrack={onEditTrack}
              onOpenKaraoke={onOpenKaraoke}
            />
          </View>
        );

      case 'authors':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Авторы</Text>
            <LocalAdminAuthorsSection
              onOpenAuthor={(preset) => onNavigate?.('Author', preset)}
            />
          </View>
        );

      case 'karaoke':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Караоке вручную</Text>
            <LocalAdminKaraokeSection
              entries={entries}
              onOpenKaraoke={onOpenKaraoke}
            />
          </View>
        );

      case 'profile':
        return (
          <View style={styles.sectionBody}>
            <LocalAdminProfileSection />
          </View>
        );

      case 'categories':
        return (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>Категории</Text>
            <Text style={styles.sectionHint}>
              Встроенные категории приложения (только просмотр).
            </Text>
            <View style={styles.categoryGrid}>
              {MUSIC_CATEGORIES.map((cat) => (
                <View
                  key={cat.id}
                  style={[styles.categoryChip, { backgroundColor: cat.color }]}
                >
                  <Ionicons name={cat.icon} size={16} color="#111" />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.menu}>
            {SECTIONS.map((item) => (
              <ProfileMenuRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                subtitle={
                  item.id === 'music'
                    ? `${stats.tracks} треков на телефоне`
                    : item.id === 'authors'
                      ? `${stats.authors} авторов`
                      : item.id === 'automation'
                      ? 'Обложки, авторы, караоке'
                      : item.id === 'karaoke'
                        ? 'Ручные метки строк'
                        : item.id === 'profile'
                        ? user?.name || 'Имя и описание'
                        : undefined
                }
                onPress={() => setSection(item.id)}
              />
            ))}
          </View>
        );
    }
  };

  const showBackToMenu = section !== 'menu';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={showBackToMenu ? () => setSection('menu') : onBack}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>
          {showBackToMenu
            ? SECTIONS.find((s) => s.id === section)?.label || 'Админка'
            : 'Админка'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#111" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 32,
  },
  menu: {
    marginTop: 8,
  },
  sectionBody: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  statCard: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  userLine: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  authorMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
});
