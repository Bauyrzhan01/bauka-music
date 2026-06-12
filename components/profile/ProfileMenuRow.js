import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileTheme } from '../../constants/mobileTheme';

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
          color={destructive ? mobileTheme.danger : mobileTheme.text}
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
        <Ionicons name="chevron-forward" size={18} color={mobileTheme.iconMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowPressed: {
    backgroundColor: mobileTheme.surfaceMuted,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: '#3a1a1a',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: mobileTheme.text,
  },
  labelDestructive: {
    color: mobileTheme.danger,
  },
  subtitle: {
    fontSize: 12,
    color: mobileTheme.textMuted,
  },
});
