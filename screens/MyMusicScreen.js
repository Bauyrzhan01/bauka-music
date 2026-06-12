import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMyLibrary } from '../context/MyLibraryContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';
import TrackCover from '../components/TrackCover';
import { localLibraryEntryToTrack } from '../utils/localLibraryToTrack';
import { enrichTrackWithCover } from '../utils/trackCoverUrl';
import { useOsBack } from '../hooks/useOsBack';
import DeviceMusicPickerScreen from './DeviceMusicPickerScreen';
import MyMusicMasonryGrid from '../components/myMusic/MyMusicMasonryGrid';

function ActionPill({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      style={[styles.actionPill, disabled && styles.actionPillDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionPillText}>{label}</Text>
    </Pressable>
  );
}

function FavoriteTrackRow({ track, active, onPress, onMenu }) {
  const enriched = enrichTrackWithCover(track);

  return (
    <Pressable
      style={[styles.trackRow, active && styles.trackRowActive]}
      onPress={onPress}
      onLongPress={onMenu}
    >
      <TrackCover
        coverUrl={enriched.coverUrl}
        size={52}
        borderRadius={6}
        iconSize={22}
      />
      <View style={styles.trackMeta}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist || 'Tolqyn'}
          {' · избранное'}
        </Text>
      </View>
      <Pressable
        style={styles.menuBtn}
        onPress={(event) => {
          event.stopPropagation?.();
          onMenu();
        }}
        hitSlop={8}
        accessibilityLabel="Действия"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.55)" />
      </Pressable>
    </Pressable>
  );
}

function TrackRow({ entry, active, onPress, onMenu }) {
  const track = enrichTrackWithCover(localLibraryEntryToTrack(entry));

  return (
    <Pressable
      style={[styles.trackRow, active && styles.trackRowActive]}
      onPress={onPress}
      onLongPress={onMenu}
    >
      <TrackCover
        coverUrl={track?.coverUrl}
        size={52}
        borderRadius={6}
        iconSize={22}
      />
      <View style={styles.trackMeta}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {entry.title || 'Без названия'}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {entry.artist || 'Я'}
          {entry.videos?.length
            ? ` · ${entry.videos.length} Reels`
            : ''}
        </Text>
      </View>
      <Pressable
        style={styles.menuBtn}
        onPress={(event) => {
          event.stopPropagation?.();
          onMenu();
        }}
        hitSlop={8}
        accessibilityLabel="Действия"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.55)" />
      </Pressable>
    </Pressable>
  );
}

export default function MyMusicScreen({ onBack, onEditTrack, onOpenKaraoke }) {
  useOsBack(onBack);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const {
    entries,
    ready,
    busy,
    pickAndAddTrack,
    deleteEntry,
    exportBackup,
    importBackup,
    importDeviceMusicAssets,
  } = useMyLibrary();
  const { favoriteTracks, toggleFavorite } = useFavorites();
  const { playTrack, openPlayer, currentTrack, isPlaying, togglePlay } =
    usePlayer();

  const localPlaylist = useMemo(
    () => entries.map(localLibraryEntryToTrack).filter(Boolean),
    [entries]
  );

  const playlist = useMemo(
    () => [...favoriteTracks, ...localPlaylist],
    [favoriteTracks, localPlaylist]
  );

  const favoriteGridEntries = useMemo(
    () =>
      favoriteTracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist || 'Tolqyn',
        _favoriteTrack: track,
      })),
    [favoriteTracks]
  );

  const hasFavorites = favoriteTracks.length > 0;
  const hasLocal = entries.length > 0;
  const hasAnyTracks = hasFavorites || hasLocal;

  const listSections = useMemo(() => {
    const sections = [];
    if (hasFavorites) {
      sections.push({
        key: 'favorites',
        title: 'Избранное',
        data: favoriteTracks,
        kind: 'favorite',
      });
    }
    if (hasLocal) {
      sections.push({
        key: 'local',
        title: 'На телефоне',
        data: entries,
        kind: 'local',
      });
    }
    return sections;
  }, [hasFavorites, hasLocal, favoriteTracks, entries]);

  const handleAdd = async () => {
    const result = await pickAndAddTrack();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Ошибка', result.error || 'Не удалось добавить трек');
      return;
    }
    if (result.entry) {
      onEditTrack?.(result.entry.id);
    }
  };

  const handlePlayLocal = useCallback(
    (entry) => {
      const track = localLibraryEntryToTrack(entry);
      if (!track) return;

      if (currentTrack?.id === entry.id) {
        togglePlay();
        openPlayer();
        return;
      }

      playTrack(track, playlist);
      openPlayer();
    },
    [currentTrack?.id, openPlayer, playTrack, playlist, togglePlay]
  );

  const handlePlayFavorite = useCallback(
    (track) => {
      if (currentTrack?.id === track.id) {
        togglePlay();
        openPlayer();
        return;
      }

      playTrack(track, playlist);
      openPlayer();
    },
    [currentTrack?.id, openPlayer, playTrack, playlist, togglePlay]
  );

  const handleExport = async () => {
    const result = await exportBackup();
    if (!result.ok) {
      Alert.alert('Экспорт', result.error || 'Не удалось экспортировать');
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Импорт резервной копии',
      'Добавить треки к существующим или заменить всю библиотеку?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Добавить',
          onPress: async () => {
            const result = await importBackup({ replace: false });
            if (result.cancelled) return;
            if (!result.ok) {
              Alert.alert('Импорт', result.error || 'Ошибка');
              return;
            }
            Alert.alert('Готово', `Импортировано треков: ${result.count}`);
          },
        },
        {
          text: 'Заменить всё',
          style: 'destructive',
          onPress: async () => {
            const result = await importBackup({ replace: true });
            if (result.cancelled) return;
            if (!result.ok) {
              Alert.alert('Импорт', result.error || 'Ошибка');
              return;
            }
            Alert.alert('Готово', `Импортировано треков: ${result.count}`);
          },
        },
      ]
    );
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Удалить трек?',
      `«${entry.title}» будет удалён с телефона.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  const openFavoriteMenu = (track) => {
    Alert.alert(track.title || 'Трек', undefined, [
      { text: 'Слушать', onPress: () => handlePlayFavorite(track) },
      {
        text: 'Убрать из избранного',
        style: 'destructive',
        onPress: () => toggleFavorite(track.id),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const openTrackMenu = (entry) => {
    const options = [
      { text: 'Слушать', onPress: () => handlePlayLocal(entry) },
      { text: 'Редактировать', onPress: () => onEditTrack?.(entry.id) },
    ];

    if (onOpenKaraoke) {
      options.push({
        text: 'Караоке',
        onPress: () => onOpenKaraoke(entry.id),
      });
    }

    options.push(
      { text: 'Удалить', style: 'destructive', onPress: () => handleDelete(entry) },
      { text: 'Отмена', style: 'cancel' }
    );

    Alert.alert(entry.title || 'Трек', undefined, options);
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.pageTitle}>Моя музыка</Text>
      <Text style={styles.pageSubtitle}>
        {hasLocal
          ? `${entries.length} ${entries.length === 1 ? 'трек' : 'треков'} на телефоне`
          : 'Нет треков на телефоне'}
        {hasFavorites
          ? `${hasLocal ? ' · ' : ''}${favoriteTracks.length} в избранном`
          : ''}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        <ActionPill
          icon="add"
          label="Добавить MP3"
          onPress={handleAdd}
          disabled={busy}
        />
        <ActionPill
          icon="phone-portrait-outline"
          label="С телефона"
          onPress={() => setShowDevicePicker(true)}
          disabled={busy}
        />
        <ActionPill
          icon="download-outline"
          label="Импорт"
          onPress={handleImport}
          disabled={busy}
        />
        {entries.length > 0 ? (
          <ActionPill
            icon="share-outline"
            label="Экспорт"
            onPress={handleExport}
            disabled={busy}
          />
        ) : null}
      </ScrollView>

      {hasAnyTracks ? (
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Библиотека</Text>
          <View style={styles.viewToggle}>
            <Pressable
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode('list')}
              accessibilityLabel="Список"
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.45)'}
              />
            </Pressable>
            <Pressable
              style={[
                styles.viewToggleBtn,
                viewMode === 'grid' && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode('grid')}
              accessibilityLabel="Сетка"
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewMode === 'grid' ? '#fff' : 'rgba(255,255,255,0.45)'}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="musical-notes-outline" size={40} color="rgba(255,255,255,0.35)" />
      </View>
      <Text style={styles.emptyTitle}>Пока пусто</Text>
      <Text style={styles.emptyText}>
        Добавьте MP3 с телефона — затем обложку, текст, клип и Reels
      </Text>
    </View>
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (showDevicePicker) {
    return (
      <DeviceMusicPickerScreen
        onBack={() => setShowDevicePicker(false)}
        onImport={importDeviceMusicAssets}
        busy={busy}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Назад">
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
      </View>

      {viewMode === 'grid' ? (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            !hasAnyTracks && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {hasFavorites ? (
            <>
              <Text style={styles.sectionLabelInset}>Избранное</Text>
              <MyMusicMasonryGrid
                entries={favoriteGridEntries}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                onPress={(item) => handlePlayFavorite(item._favoriteTrack)}
                onLongPress={(item) => openFavoriteMenu(item._favoriteTrack)}
              />
            </>
          ) : null}
          {hasLocal ? (
            <>
              <Text
                style={[
                  styles.sectionLabelInset,
                  hasFavorites && styles.sectionLabelSpaced,
                ]}
              >
                На телефоне
              </Text>
              <MyMusicMasonryGrid
                entries={entries}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                onPress={handlePlayLocal}
                onLongPress={openTrackMenu}
              />
            </>
          ) : null}
          {!hasAnyTracks ? renderEmpty() : null}
        </ScrollView>
      ) : (
        <SectionList
          sections={listSections}
          keyExtractor={(item, index) =>
            item.id ? String(item.id) : `item-${index}`
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            !hasAnyTracks && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabelInset}>{section.title}</Text>
          )}
          renderItem={({ item, section }) =>
            section.kind === 'favorite' ? (
              <FavoriteTrackRow
                track={item}
                active={currentTrack?.id === item.id && isPlaying}
                onPress={() => handlePlayFavorite(item)}
                onMenu={() => openFavoriteMenu(item)}
              />
            ) : (
              <TrackRow
                entry={item}
                active={currentTrack?.id === item.id && isPlaying}
                onPress={() => handlePlayLocal(item)}
                onMenu={() => openTrackMenu(item)}
              />
            )
          }
        />
      )}

      {busy ? (
        <View style={styles.busyOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  topBar: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  actionsRow: {
    gap: 8,
    paddingTop: 16,
    paddingBottom: 4,
    paddingRight: 16,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionPillDisabled: {
    opacity: 0.6,
  },
  actionPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionRow: {
    marginTop: 20,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabelInset: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabelSpaced: {
    marginTop: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  viewToggleBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: '#2a2a2a',
  },
  listContent: {
    paddingBottom: 28,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  trackMeta: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  trackArtist: {
    marginTop: 3,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
