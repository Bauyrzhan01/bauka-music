import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MUSIC_CATEGORIES } from '../data/categories';
import SearchBar from '../components/search/SearchBar';
import TrackResultItem from '../components/search/TrackResultItem';
import CategoryFilterRow from '../components/search/CategoryFilterRow';
import { searchCategories, searchTracks } from '../utils/searchTracks';
import { usePlayer } from '../context/PlayerContext';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useOsBack } from '../hooks/useOsBack';

export default function SearchScreen({ searchPreset, onClearPreset, onBack }) {
  useOsBack(onBack);
  const { playTrack, openPlayer, currentTrack } = usePlayer();
  const { tracks: catalogTracks } = useMusicCatalog();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [authorId, setAuthorId] = useState(null);

  useEffect(() => {
    if (!searchPreset?.authorId) return;
    setAuthorId(searchPreset.authorId);
    setCategoryId(null);
    setQuery(searchPreset.authorName || '');
  }, [searchPreset]);

  const tracks = useMemo(
    () => searchTracks(query, categoryId, authorId, catalogTracks),
    [query, categoryId, authorId, catalogTracks]
  );

  const matchedCategories = useMemo(
    () => searchCategories(query),
    [query]
  );

  const handleCategorySelect = (category) => {
    setCategoryId(category?.id ?? null);
    setAuthorId(null);
    onClearPreset?.();
    if (category) {
      setQuery(category.name);
    } else {
      setQuery('');
    }
  };

  const listHeader = (
    <View>
      <SearchBar
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          if (!text.trim()) {
            setCategoryId(null);
            setAuthorId(null);
            onClearPreset?.();
          }
        }}
        onClear={() => {
          setQuery('');
          setCategoryId(null);
          setAuthorId(null);
          onClearPreset?.();
        }}
      />

      <CategoryFilterRow
        categories={MUSIC_CATEGORIES}
        activeId={categoryId}
        onSelect={handleCategorySelect}
      />

      {matchedCategories.length > 0 && query.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Категории</Text>
          <View style={styles.categoryMatches}>
            {matchedCategories.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryMatch}
                onPress={() => handleCategorySelect(cat)}
              >
                <Ionicons name={cat.icon} size={16} color="#ffffff" />
                <Text style={styles.categoryMatchText}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {authorId ? (
        <Pressable
          style={styles.authorChip}
          onPress={() => {
            setAuthorId(null);
            setQuery('');
            onClearPreset?.();
          }}
        >
          <Text style={styles.authorChipText}>
            Автор: {searchPreset?.authorName || query} ×
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>
        {authorId || query.trim() || categoryId ? 'Результаты' : 'Все треки'} ·{' '}
        {tracks.length}
      </Text>
    </View>
  );

  const emptyComponent = (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={48} color="#666666" />
      <Text style={styles.emptyTitle}>Ничего не найдено</Text>
      <Text style={styles.emptyText}>
        Попробуйте другое название или выберите категорию
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Назад">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Поиск</Text>
        <View style={styles.topSpacer} />
      </View>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        renderItem={({ item }) => (
          <TrackResultItem
            track={item}
            active={currentTrack?.id === item.id}
            onPress={(track) => {
              playTrack(track, tracks);
              openPlayer();
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  topSpacer: {
    width: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9a9a9a',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryMatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryMatchText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
  authorChip: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2b2b2b',
  },
  authorChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 20,
  },
});
