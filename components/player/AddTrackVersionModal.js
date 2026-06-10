import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadTrackVersion } from '../../api/trackVersionsApi';
import { pickVersionMedia } from '../../utils/pickVersionMedia';
import { isAutoContentTitle } from '../../utils/displayContentTitle';

function titleFromFileName(name) {
  return name?.replace(/\.[^.]+$/i, '').trim() || '';
}

function buildContentTitle(titlePrefix, fileName) {
  const prefix = titlePrefix.trim();
  if (prefix) return prefix;

  const fromFile = titleFromFileName(fileName);
  if (fromFile && !isAutoContentTitle(fromFile)) return fromFile;

  return 'Моё видео';
}

export default function AddTrackVersionModal({
  visible,
  baseTrack,
  user,
  onClose,
  onUploaded,
}) {
  const [title, setTitle] = useState('');
  const [pickedFiles, setPickedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setPickedFiles([]);
    setUploadIndex(0);
    setError('');
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const appendPicked = (items, replace = false) => {
    setPickedFiles((prev) => (replace ? items : [...prev, ...items]));
    if (!title.trim() && items.length === 1) {
      const fromFile = titleFromFileName(items[0].file.name);
      if (fromFile) setTitle(fromFile);
    }
  };

  const handlePick = async (multiple) => {
    setError('');
    const result = await pickVersionMedia({ multiple });
    if (!result.ok) {
      if (!result.cancelled) setError('Не удалось выбрать файлы');
      return;
    }

    if (multiple && result.files?.length) {
      appendPicked(result.files, false);
      return;
    }

    if (result.file) {
      appendPicked(
        [{ file: result.file, suggestedType: result.suggestedType || 'edit' }],
        false
      );
    }
  };

  const removeFile = (index) => {
    setPickedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!pickedFiles.length) {
      setError('Сначала выберите один или несколько файлов');
      return;
    }
    if (!user?.email) {
      setError('Войдите в аккаунт');
      return;
    }

    setUploading(true);
    setError('');
    const uploaded = [];

    try {
      for (let i = 0; i < pickedFiles.length; i += 1) {
        setUploadIndex(i + 1);
        const { file, suggestedType } = pickedFiles[i];
        const version = await uploadTrackVersion(
          baseTrack.id,
          {
            title: buildContentTitle(title, file.name),
            type: suggestedType,
            userEmail: user.email,
            userName: user?.name || user?.email || 'user',
            baseFilename: baseTrack.filename,
            avatarUri: user.avatarUri || undefined,
          },
          file
        );
        uploaded.push(version);
      }

      if (uploaded.length === 1) {
        onUploaded(uploaded[0]);
      } else {
        onUploaded(uploaded);
      }
      reset();
      onClose();
    } catch (err) {
      setError(
        uploaded.length
          ? `Загружено ${uploaded.length} из ${pickedFiles.length}. ${err.message || 'Ошибка'}`
          : err.message || 'Не удалось загрузить'
      );
      if (uploaded.length) {
        onUploaded(uploaded.length === 1 ? uploaded[0] : uploaded);
      }
    } finally {
      setUploading(false);
      setUploadIndex(0);
    }
  };

  const videoCount = pickedFiles.filter((f) => f.suggestedType === 'video').length;
  const audioCount = pickedFiles.length - videoCount;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Новый контент</Text>
            <Pressable onPress={handleClose} hitSlop={8} disabled={uploading}>
              <Ionicons name="close" size={24} color="#111" />
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Трек: {baseTrack.title}. Можно выбрать сразу несколько видео или аудио.
          </Text>

          <Text style={styles.label}>
            {pickedFiles.length > 1
              ? 'Название для всех (необязательно)'
              : 'Название'}
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={
              pickedFiles.length > 1
                ? 'Одно имя на все видео'
                : 'Название контента'
            }
            editable={!uploading}
          />

          <View style={styles.pickRow}>
            <Pressable
              style={[styles.pickBtn, styles.pickBtnFlex]}
              onPress={() => handlePick(true)}
              disabled={uploading}
            >
              <Ionicons name="images-outline" size={20} color="#111" />
              <Text style={styles.pickBtnText}>Выбрать несколько</Text>
            </Pressable>
            <Pressable
              style={styles.pickBtnSmall}
              onPress={() => handlePick(false)}
              disabled={uploading}
            >
              <Ionicons name="add-outline" size={22} color="#111" />
            </Pressable>
          </View>

          {pickedFiles.length > 0 ? (
            <View style={styles.fileListWrap}>
              <Text style={styles.fileSummary}>
                {pickedFiles.length} файл(ов)
                {videoCount ? ` · ${videoCount} видео` : ''}
                {audioCount ? ` · ${audioCount} аудио` : ''}
              </Text>
              <ScrollView
                style={styles.fileList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {pickedFiles.map((item, index) => (
                  <View key={`${item.file.uri}-${index}`} style={styles.fileRow}>
                    <Ionicons
                      name={
                        item.suggestedType === 'video'
                          ? 'videocam-outline'
                          : 'musical-note-outline'
                      }
                      size={18}
                      color="#666"
                    />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {item.file.name}
                    </Text>
                    <Pressable
                      onPress={() => removeFile(index)}
                      hitSlop={8}
                      disabled={uploading}
                    >
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading || !pickedFiles.length}
          >
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.uploadBtnText}>
                  {uploadIndex} / {pickedFiles.length}
                </Text>
              </View>
            ) : (
              <Text style={styles.uploadBtnText}>
                {pickedFiles.length > 1
                  ? `Опубликовать (${pickedFiles.length})`
                  : 'Опубликовать'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  pickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 10,
    padding: 14,
  },
  pickBtnFlex: {
    flex: 1,
  },
  pickBtnSmall: {
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fileListWrap: {
    marginBottom: 12,
  },
  fileSummary: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  fileList: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#111',
  },
  error: {
    color: '#c00',
    fontSize: 13,
    marginBottom: 10,
  },
  uploadBtn: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
