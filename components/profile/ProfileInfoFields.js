import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ProfileField from './ProfileField';

export default function ProfileInfoFields() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setDirty(false);
  }, [user?.name, user?.bio]);

  const markDirty = () => setDirty(true);

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
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="person-outline" size={20} color="#ffffff" />
        <Text style={styles.cardTitle}>Данные профиля</Text>
      </View>

      <ProfileField
        label="Имя"
        icon="at-outline"
        value={name}
        onChangeText={(text) => {
          setName(text);
          markDirty();
        }}
        placeholder="Как вас показывать в Reels"
        maxLength={40}
        hint="Отображается рядом с вашими видео"
      />

      <ProfileField
        label="Email"
        icon="mail-outline"
        value={user?.email || ''}
        editable={false}
        hint="Используется для входа, изменить нельзя"
      />

      <ProfileField
        label="О себе"
        icon="document-text-outline"
        value={bio}
        onChangeText={(text) => {
          setBio(text);
          markDirty();
        }}
        placeholder="Коротко о себе (необязательно)"
        multiline
        maxLength={120}
        hint={`${bio.length}/120`}
      />

      <Pressable
        style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!dirty}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.saveBtnText}>
          {dirty ? 'Сохранить изменения' : 'Всё сохранено'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#000000',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b2b2b',
    borderRadius: 12,
    paddingVertical: 14,
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
