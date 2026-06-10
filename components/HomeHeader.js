import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const ICON_SIZE = 24;
const ICON_COLOR = '#000';
const AVATAR_SIZE = 32;

export default function HomeHeader({
  accountName,
  avatarUri,
  avatarAccentColor = '#111111',
  onProfile,
  onSearch,
  onNotifications,
}) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.left} onPress={onProfile}>
        {avatarUri ? (
          <View
            style={[
              styles.avatarWrap,
              { borderColor: avatarAccentColor || '#111111' },
            ]}
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
        ) : (
          <Ionicons
            name="person-circle-outline"
            size={28}
            color={ICON_COLOR}
          />
        )}
        <Text style={styles.accountName} numberOfLines={1}>
          {accountName || 'Профиль'}
        </Text>
      </Pressable>

      <View style={styles.right}>
        <Pressable onPress={onSearch} accessibilityLabel="Поиск">
          <Ionicons name="search-outline" size={ICON_SIZE} color={ICON_COLOR} />
        </Pressable>
        <Pressable onPress={onNotifications} accessibilityLabel="Уведомления">
          <Ionicons
            name="notifications-outline"
            size={ICON_SIZE}
            color={ICON_COLOR}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  accountName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
