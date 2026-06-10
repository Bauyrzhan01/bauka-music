import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
              color={active ? '#fff' : '#111'}
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
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
