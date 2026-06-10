import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { resolveAuthorAvatarUrl } from '../../utils/resolveServerMediaUrl';

const SIZE = 44;

export default function AuthorItem({ author, onPress, selected = false }) {
  if (!author) return null;

  const displayName = author.name || 'Автор';
  const avatarUri = resolveAuthorAvatarUrl(author);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Pressable
      style={[styles.item, selected && styles.itemSelected]}
      onPress={() => onPress?.(author)}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={[styles.avatarImage, selected && styles.avatarSelected]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.avatar, selected && styles.avatarSelected]}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  );
}

export { SIZE as AUTHOR_ITEM_WIDTH };

const styles = StyleSheet.create({
  item: {
    width: SIZE + 8,
    alignItems: 'center',
  },
  itemSelected: {
    opacity: 1,
  },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarImage: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#111',
  },
  avatarSelected: {
    borderWidth: 2,
    borderColor: '#111',
  },
  initial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
    maxWidth: SIZE + 12,
  },
});
