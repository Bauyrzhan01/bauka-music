import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MUSIC_CATEGORIES } from '../../data/categories';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function WebAdminCategories() {
  const { isMobile, pageTitleSize } = useWebBreakpoint();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, { fontSize: pageTitleSize }]}>
        Категории
      </Text>
      <Text style={styles.pageSubtitle}>
        Категории на главной странице приложения
      </Text>

      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {MUSIC_CATEGORIES.map((cat) => (
          <View
            key={cat.id}
            style={[styles.card, isMobile && styles.cardMobile]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={cat.icon} size={24} color="#111" />
            </View>
            <Text style={styles.name}>{cat.name}</Text>
            <Text style={styles.id}>id: {cat.id}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Редактирование: файл data/categories.js
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
  },
  id: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: '#888',
  },
});
