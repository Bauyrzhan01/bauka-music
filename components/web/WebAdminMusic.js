import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  checkMusicApi,
  deleteMusicTrack,
  fetchMusicCatalog,
  uploadMusicFiles,
} from '../../api/musicApi';
import { fetchAllTrackVersions } from '../../api/trackVersionsApi';
import { isApiVersionsSupported } from '../../api/parseApiJson';
import { getApiBaseUrl } from '../../constants/api';
import { confirmAction } from '../../utils/confirmAction';
import { getClipProviderLabel, parseClipUrl } from '../../utils/parseClipUrl';
import { pickMusicFiles } from '../../utils/pickMusicFiles';
import WebAdminTrackEdit from './WebAdminTrackEdit';
import WebAdminContents from './WebAdminContents';
import AdminPageHeader from './AdminPageHeader';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function WebAdminMusic({ onOpenAuthor }) {
  const { isMobile } = useWebBreakpoint();
  const [tracks, setTracks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [editingTrack, setEditingTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState(true);
  const [contents, setContents] = useState([]);
  const [contentsLoading, setContentsLoading] = useState(true);
  const [versionsSupported, setVersionsSupported] = useState(false);

  useEffect(() => {
    if (!successInfo) return undefined;
    const timer = setTimeout(() => setSuccessInfo(null), 5000);
    return () => clearTimeout(timer);
  }, [successInfo]);

  const showSuccess = (title, items = []) => {
    setSuccessInfo({ title, items });
  };

  const applyCatalog = (data) => {
    setTracks(data.tracks ?? []);
    setAuthors(data.authors ?? []);
  };

  const loadTracks = useCallback(async () => {
    setError('');
    const online = await checkMusicApi();
    setApiOnline(online);
    if (!online) {
      setError(
        `API недоступен (${getApiBaseUrl()}). На ноутбуке: npm start. С телефона открывайте админку по IP ноутбука в Wi‑Fi, не localhost.`
      );
      setContents([]);
      setContentsLoading(false);
      setLoading(false);
      return;
    }
    try {
      const [data, supported, allContents] = await Promise.all([
        fetchMusicCatalog(),
        isApiVersionsSupported(),
        fetchAllTrackVersions().catch(() => []),
      ]);
      applyCatalog(data);
      setVersionsSupported(supported);
      setContents(allContents);
      setContentsLoading(false);
    } catch (err) {
      setApiOnline(false);
      setContents([]);
      setContentsLoading(false);
      setError(err.message || 'Не удалось загрузить список треков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleUpload = async () => {
    setError('');
    setSuccessInfo(null);

    const picked = await pickMusicFiles();
    if (!picked.ok) {
      if (picked.error) setError(picked.error);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMusicFiles(picked.files);
      applyCatalog(result);

      const uploaded = result.uploaded ?? picked.files.map((file) => file.name);
      const count = uploaded.length;

      showSuccess(
        count === 1 ? 'Трек успешно добавлен!' : `Успешно добавлено треков: ${count}`,
        uploaded
      );
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (track) => {
    const ok = await confirmAction({
      title: 'Удалить трек?',
      message: `${track.title}\nФайл будет удалён из music/`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;

    setError('');
    setSuccessInfo(null);
    try {
      const result = await deleteMusicTrack(track.filename);
      applyCatalog(result);
      showSuccess('Трек удалён', [track.filename]);
    } catch (err) {
      setError(err.message || 'Не удалось удалить');
    }
  };

  if (editingTrack) {
    return (
      <WebAdminTrackEdit
        track={editingTrack}
        authors={authors}
        onBack={() => setEditingTrack(null)}
        onSaved={(result) => {
          applyCatalog(result);
          setEditingTrack(null);
          showSuccess('Трек сохранён', [result.track?.title || editingTrack.title]);
        }}
        onPartialSaved={(result) => {
          applyCatalog(result);
          const updated =
            result.track ||
            result.tracks?.find((t) => t.filename === editingTrack.filename);
          if (updated) setEditingTrack(updated);
          showSuccess('Синхронизация сохранена', [
            updated?.title || editingTrack.title,
          ]);
        }}
        onOpenAuthor={onOpenAuthor}
      />
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <AdminPageHeader
        title="Музыка"
        subtitle="Загрузка файлов, название, текст и автор"
      >
        <Pressable
          style={[
            styles.uploadBtn,
            isMobile && styles.uploadBtnFull,
            uploading && styles.uploadBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Добавить музыку</Text>
            </>
          )}
        </Pressable>
      </AdminPageHeader>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Как это работает</Text>
        <Text style={styles.infoText}>
          1. Загрузите .mp3 / .m4a / .wav / .aac{'\n'}
          2. Нажмите «Изменить» — укажите название, текст и автора{'\n'}
          3. Авторов создайте в разделе «Авторы»{'\n'}
          4. На телефоне перезагрузите Metro после изменений
        </Text>
      </View>

      {!apiOnline ? (
        <View style={styles.apiWarning}>
          <Ionicons name="warning" size={22} color="#b45309" />
          <View style={styles.apiWarningText}>
            <Text style={styles.apiWarningTitle}>Нужен перезапуск сервера</Text>
            <Text style={styles.apiWarningBody}>
              Выполните npm start и обновите страницу (F5)
            </Text>
          </View>
        </View>
      ) : null}

      {successInfo ? (
        <View style={styles.successBanner}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={22} color="#0a7a2f" />
            <Text style={styles.successTitle}>{successInfo.title}</Text>
            <Pressable onPress={() => setSuccessInfo(null)}>
              <Ionicons name="close" size={20} color="#0a7a2f" />
            </Pressable>
          </View>
          {successInfo.items.length > 0 ? (
            <View style={styles.successList}>
              {successInfo.items.map((name) => (
                <Text key={name} style={styles.successItem}>
                  • {name}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#c00" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          <Text style={styles.count}>Треков: {tracks.length}</Text>

          {tracks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                Пока нет треков. Нажмите «Добавить музыку»
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {tracks.map((track) => (
                <View
                  key={track.id}
                  style={[styles.row, isMobile && styles.rowMobile]}
                >
                  <View style={styles.rowMain}>
                    <Ionicons name="musical-note" size={18} color="#111" />
                    <View style={styles.rowText}>
                      <View style={styles.titleRow}>
                        <Text style={styles.trackTitle}>{track.title}</Text>
                        {parseClipUrl(track.clipUrl || track.youtubeUrl) ? (
                          <Ionicons
                            name="videocam"
                            size={16}
                            color="#c00"
                            accessibilityLabel={getClipProviderLabel(
                              parseClipUrl(track.clipUrl || track.youtubeUrl)
                                ?.provider
                            )}
                          />
                        ) : null}
                      </View>
                      {track.artist ? (
                        <Text style={styles.trackArtist}>{track.artist}</Text>
                      ) : null}
                      {track.description ? (
                        <Text style={styles.trackDesc} numberOfLines={2}>
                          {track.description}
                        </Text>
                      ) : null}
                      <Text style={styles.trackFile}>{track.filename}</Text>
                    </View>
                  </View>
                  <View style={[styles.actions, isMobile && styles.actionsMobile]}>
                    <Pressable
                      style={styles.editBtn}
                      onPress={() => setEditingTrack(track)}
                    >
                      <Text style={styles.editBtnText}>Изменить</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(track)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#c00" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <WebAdminContents
            tracks={tracks}
            contents={contents}
            loading={contentsLoading}
            versionsSupported={versionsSupported}
            onDeleted={(id) => {
              setContents((prev) => prev.filter((item) => item.id !== id));
              showSuccess('Контент удалён');
            }}
            onError={setError}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
  },
  uploadBtnFull: {
    width: '100%',
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  apiWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  apiWarningText: {
    flex: 1,
  },
  apiWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 6,
  },
  apiWarningBody: {
    fontSize: 13,
    color: '#92400e',
  },
  successBanner: {
    backgroundColor: '#e8f8ee',
    borderWidth: 1,
    borderColor: '#9fd4b0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successTitle: {
    flex: 1,
    color: '#0a7a2f',
    fontSize: 15,
    fontWeight: '700',
  },
  successList: {
    marginTop: 10,
    paddingLeft: 32,
    gap: 4,
  },
  successItem: {
    color: '#1b5e3a',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fdecec',
    borderWidth: 1,
    borderColor: '#f5b5b5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#c00',
    fontSize: 14,
  },
  loader: {
    marginTop: 24,
  },
  count: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  rowMobile: {
    flexDirection: 'column',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  trackArtist: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
  },
  trackDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  trackFile: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionsMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editBtn: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
});
