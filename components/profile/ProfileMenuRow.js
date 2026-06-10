import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileMenuRow({
  icon,
  label,
  subtitle,
  onPress,
  destructive = false,
  showChevron = true,
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconWrap,
          destructive && styles.iconWrapDestructive,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? '#c00' : '#111'}
        />
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[styles.label, destructive && styles.labelDestructive]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color="#bbb" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowPressed: {
    backgroundColor: '#f8f8f8',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: '#fee2e2',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  labelDestructive: {
    color: '#c00',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
});
