import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteTrackVersion } from '../../api/trackVersionsApi';
import { resolveVersionMediaUrl } from '../../utils/resolveVersionMediaUrl';
import { confirmAction } from '../../utils/confirmAction';

function findTrackTitle(tracks, item) {
  const byId = tracks.find((track) => track.id === item.baseTrackId);
  if (byId) return byId.title;
  const byFile = tracks.find((track) => track.filename === item.baseFilename);
  if (byFile) return byFile.title;
  return item.baseFilename || item.baseTrackId || '—';
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function typeLabel(type) {
  if (type === 'video') return 'Видео';
  return 'Аудио';
}

export default function WebAdminContents({
  tracks,
  contents,
  loading,
  versionsSupported,
  onDeleted,
  onError,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (item) => {
    const ok = await confirmAction({
      title: 'Удалить контент?',
      message: `${item.title}\n@${item.userName}\nФайл будет удалён с сервера.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(item.id);
    onError?.('');
    try {
      await deleteTrackVersion(item.id);
      onDeleted?.(item.id);
    } catch (err) {
      onError?.(err.message || 'Не удалось удалить контент');
    } finally {
      setDeletingId(null);
    }
  };

  const openMedia = (item) => {
    const url = resolveVersionMediaUrl(item);
    if (!url) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url).catch(() => {});
  };

  if (!versionsSupported) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Контенты пользователей</Text>
        <Text style={styles.hint}>
          Нужен API v3. Перезапустите npm start и обновите страницу.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Контенты пользователей</Text>
      <Text style={styles.sectionSubtitle}>
        Видео и аудио, которые пользователи добавили к трекам в приложении
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#111" />
      ) : contents.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>Пока нет пользовательских контентов</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {contents.map((item) => {
            const trackTitle = findTrackTitle(tracks, item);
            const isVideo = item.type === 'video';
            const busy = deletingId === item.id;

            return (
              <View key={item.id} style={styles.row}>
                <View
                  style={[
                    styles.typeBadge,
                    isVideo ? styles.typeVideo : styles.typeAudio,
                  ]}
                >
                  <Ionicons
                    name={isVideo ? 'videocam' : 'headset'}
                    size={18}
                    color={isVideo ? '#fff' : '#111'}
                  />
                </View>

                <View style={styles.rowMain}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.metaLine}>
                    {typeLabel(item.type)} · @{item.userName}
                    {item.userEmail ? ` · ${item.userEmail}` : ''}
                  </Text>
                  <Text style={styles.metaLine}>
                    Трек: <Text style={styles.metaStrong}>{trackTitle}</Text>
                  </Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  <Pressable onPress={() => openMedia(item)} style={styles.openLink}>
                    <Text style={styles.openLinkText}>Открыть файл</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#c00" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#c00" />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  loader: {
    marginVertical: 20,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 14,
  },
  typeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeVideo: {
    backgroundColor: '#111',
  },
  typeAudio: {
    backgroundColor: '#f0f0f0',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 2,
  },
  metaStrong: {
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  openLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  openLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteBtn: {
    padding: 6,
    minWidth: 32,
    alignItems: 'center',
  },
});
