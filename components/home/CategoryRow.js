import { ScrollView, StyleSheet } from 'react-native';
import { MUSIC_CATEGORIES } from '../../data/categories';
import CategoryItem from './CategoryItem';

export default function CategoryRow({ onCategoryPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MUSIC_CATEGORIES.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          onPress={onCategoryPress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
});
