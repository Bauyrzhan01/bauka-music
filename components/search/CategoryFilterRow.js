import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileTheme } from '../../constants/mobileTheme';

export default function CategoryFilterRow({ categories, activeId, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pressable
        style={[styles.chip, !activeId && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, !activeId && styles.chipTextActive]}>
          Все
        </Text>
      </Pressable>
      {categories.map((cat) => {
        const active = activeId === cat.id;
        return (
          <Pressable
            key={cat.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(cat)}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={active ? mobileTheme.text : mobileTheme.textMuted}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: mobileTheme.surface,
  },
  chipActive: {
    backgroundColor: mobileTheme.surfaceLight,
  },
  chipText: {
    fontSize: 13,
    color: mobileTheme.textMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: mobileTheme.text,
    fontWeight: '600',
  },
});
