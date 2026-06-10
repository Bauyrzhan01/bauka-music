import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  deviceAssetArtist,
  deviceAssetTitle,
  fetchDeviceMusicPage,
} from '../utils/importFromDeviceMusic';
import { useOsBack } from '../hooks/useOsBack';

export default function DeviceMusicPickerScreen({ onBack, onImport, busy }) {
  useOsBack(onBack);
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasNext, setHasNext] = useState(false);
  const [endCursor, setEndCursor] = useState(undefined);

  const loadPage = useCallback(async (after) => {
    const page = await fetchDeviceMusicPage({ first: 60, after });
    setAssets((current) =>
      after ? [...current, ...page.assets] : page.assets
    );
    setHasNext(page.hasNextPage);
    setEndCursor(page.endCursor);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        await loadPage();
      } catch (err) {
        setError(err.message || 'Не удалось загрузить музыку');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  const handleLoadMore = async () => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(endCursor);
    } catch (err) {
      Alert.alert('Ошибка', err.message || 'Не удалось загрузить ещё');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggle = (id) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const selectedAssets = assets.filter((asset) => selected[asset.id]);
  const selectedCount = selectedAssets.length;

  const handleImport = async () => {
    if (!selectedCount) {
      Alert.alert('Импорт', 'Выберите хотя бы один трек');
      return;
    }
    const result = await onImport?.(selectedAssets);
    if (!result?.ok && !result?.cancelled) {
      Alert.alert('Импорт', result?.error || 'Не удалось импортировать');
      return;
    }
    if (result?.ok) {
      Alert.alert('Готово', `Импортировано треков: ${result.count}`);
      onBack?.();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.topTitle}>Музыка телефона</Text>
        <View style={styles.topSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>На телефоне не найдено аудиофайлов</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color="#111" />
            ) : null
          }
          renderItem={({ item }) => {
            const active = !!selected[item.id];
            return (
              <Pressable
                style={[styles.row, active && styles.rowActive]}
                onPress={() => toggle(item.id)}
              >
                <Ionicons
                  name={active ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={active ? '#111' : '#bbb'}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {deviceAssetTitle(item)}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {deviceAssetArtist(item)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.importBtn, (!selectedCount || busy) && styles.btnDisabled]}
          onPress={handleImport}
          disabled={!selectedCount || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importBtnText}>
              Импортировать ({selectedCount})
            </Text>
          )}
        </Pressable>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 8,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  topSpacer: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowActive: {
    backgroundColor: '#f8f8f8',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  rowMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  importBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  importBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
