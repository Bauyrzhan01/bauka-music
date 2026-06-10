import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatarChip from '../UserAvatarChip';
import { resolveContentUserAvatar } from '../../utils/resolveContentUserAvatar';

export default function ContentAuthorRow({
  item,
  currentUser,
  variant = 'onDark',
  avatarSize = 26,
  textStyle,
  onPressAuthor,
}) {
  const { uri, accentColor } = resolveContentUserAvatar(item, currentUser);
  const label = item?.userName || item?.userEmail?.split('@')[0] || 'user';

  const handlePress = () => {
    if (!onPressAuthor || !item) return;
    onPressAuthor({
      userEmail: item.userEmail,
      userName: item.userName,
      userAvatarUrl: item.userAvatarUrl,
    });
  };

  const content = (
    <View style={styles.row}>
      <UserAvatarChip
        uri={uri}
        name={label}
        size={avatarSize}
        variant={variant}
        accentColor={accentColor}
      />
      <Text style={[styles.name, textStyle]} numberOfLines={1}>
        @{label}
      </Text>
      {onPressAuthor ? (
        <Ionicons name="chevron-forward" size={14} color="#aaa" />
      ) : null}
    </View>
  );

  if (!onPressAuthor) {
    return content;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      onPress={handlePress}
      accessibilityLabel="Профиль пользователя"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
    color: '#ddd',
    fontWeight: '500',
  },
});
