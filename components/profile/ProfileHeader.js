import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import getImageAccentColor from '../../utils/getImageAccentColor';
import AnimatedProfileAvatar from './AnimatedProfileAvatar';

const STALE_ACCENTS = new Set(['#333333', '#000000', '#111111']);

export default function ProfileHeader({
  name,
  email,
  reelsCount = 0,
  onEditProfile,
}) {
  const { user, updateAvatar } = useAuth();
  const accentSyncedForUri = useRef(null);

  useEffect(() => {
    if (!user?.avatarUri) return undefined;

    const accent = user.avatarAccentColor?.toLowerCase();
    if (accent && !STALE_ACCENTS.has(accent)) {
      accentSyncedForUri.current = user.avatarUri;
      return undefined;
    }

    if (accentSyncedForUri.current === user.avatarUri) {
      return undefined;
    }

    let cancelled = false;
    getImageAccentColor(user.avatarUri).then((color) => {
      if (cancelled) return;
      accentSyncedForUri.current = user.avatarUri;
      const next = color?.toLowerCase();
      if (!next || STALE_ACCENTS.has(next) || next === accent) {
        return;
      }
      updateAvatar(user.avatarUri, color);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.avatarUri, user?.avatarAccentColor, updateAvatar]);

  const content = (
    <>
      <AnimatedProfileAvatar
        avatarUri={user?.avatarUri}
        accentColor={user?.avatarAccentColor}
      />
      <Text style={styles.name}>{name}</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}
      {user?.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          {user.bio}
        </Text>
      ) : null}
      <Text style={styles.avatarHint}>
        {onEditProfile
          ? 'Нажмите, чтобы редактировать профиль'
          : 'Нажмите на фото, чтобы сменить аватар'}
      </Text>
      {reelsCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{reelsCount} Reels</Text>
        </View>
      ) : null}
    </>
  );

  if (onEditProfile) {
    return (
      <Pressable style={styles.container} onPress={onEditProfile}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  avatarHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
});
