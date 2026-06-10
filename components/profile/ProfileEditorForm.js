import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { uploadProfileAvatar } from '../../api/profileApi';
import { pickProfileImage } from '../../utils/pickProfileImage';
import { persistImage } from '../../utils/persistImage';
import { resolveServerMediaUrl } from '../../utils/resolveServerMediaUrl';
import getImageAccentColor from '../../utils/getImageAccentColor';
import ProfileField from './ProfileField';
import AnimatedProfileAvatar from './AnimatedProfileAvatar';

export default function ProfileEditorForm({ onSaved }) {
  const { user, updateProfile, updateAvatar } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dirty, setDirty] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const isPickingRef = useRef(false);

  useEffect(() => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setDirty(false);
  }, [user?.name, user?.bio]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Профиль', 'Введите имя');
      return;
    }

    updateProfile({
      name: trimmedName,
      bio: bio.trim(),
    });
    setDirty(false);
    onSaved?.();
    Alert.alert('Сохранено', 'Профиль обновлён');
  };

  const handleAvatarPress = async () => {
    if (isPickingRef.current || avatarBusy) return;

    Alert.alert('Аватар', 'Выберите действие', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выбрать фото',
        onPress: async () => {
          isPickingRef.current = true;
          const picked = await pickProfileImage();
          isPickingRef.current = false;

          if (!picked.ok) {
            if (picked.error) Alert.alert('Аватар', picked.error);
            return;
          }

          setAvatarBusy(true);
          try {
            const savedUri = await persistImage(picked.uri, 'avatars');
            if (!savedUri) {
              Alert.alert('Аватар', 'Не удалось сохранить фото');
              return;
            }

            let displayUri = resolveServerMediaUrl(savedUri) || savedUri;
            if (user?.email && !user?.isLocal) {
              try {
                const remote = await uploadProfileAvatar(user.email, savedUri);
                if (remote?.avatarUrl) {
                  displayUri = remote.avatarUrl;
                }
              } catch (err) {
                Alert.alert(
                  'Аватар',
                  err.message ||
                    'Сохранено локально. Запустите сервер для синхронизации.'
                );
              }
            }

            const accentColor = await getImageAccentColor(displayUri);
            updateAvatar(displayUri, accentColor);
            Alert.alert('Готово', 'Аватар обновлён');
          } catch (err) {
            Alert.alert('Аватар', err.message || 'Не удалось сохранить фото');
          } finally {
            setAvatarBusy(false);
          }
        },
      },
      ...(user?.avatarUri
        ? [
            {
              text: 'Удалить фото',
              style: 'destructive',
              onPress: () => {
                updateAvatar(null, '#000000');
                Alert.alert('Готово', 'Аватар удалён');
              },
            },
          ]
        : []),
    ]);
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.avatarWrap}
        onPress={handleAvatarPress}
        disabled={avatarBusy}
      >
        <AnimatedProfileAvatar
          avatarUri={user?.avatarUri}
          accentColor={user?.avatarAccentColor}
        />
        <View style={styles.avatarBadge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
        <Text style={styles.avatarHint}>
          {avatarBusy ? 'Сохранение…' : 'Нажмите, чтобы сменить фото'}
        </Text>
      </Pressable>

      <ProfileField
        label="Имя"
        icon="at-outline"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setDirty(true);
        }}
        placeholder="Как вас показывать в приложении"
        maxLength={40}
      />

      <ProfileField
        label="О себе"
        icon="document-text-outline"
        value={bio}
        onChangeText={(text) => {
          setBio(text);
          setDirty(true);
        }}
        placeholder="Коротко о себе (необязательно)"
        multiline
        maxLength={120}
        hint={`${bio.length}/120`}
      />

      {user?.email && !user?.isLocal ? (
        <ProfileField
          label="Email"
          icon="mail-outline"
          value={user.email}
          editable={false}
        />
      ) : null}

      <Pressable
        style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!dirty}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.saveBtnText}>
          {dirty ? 'Сохранить' : 'Сохранено'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    right: '28%',
    bottom: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#999',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
