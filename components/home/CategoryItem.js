import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BOX_WIDTH = 100;
const BOX_HEIGHT = 50;

export default function CategoryItem({ category, onPress }) {
  return (
    <Pressable style={styles.item} onPress={() => onPress?.(category)}>
      <View style={styles.box}>
        <Ionicons name={category.icon} size={18} color="#ffffff" />
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
}

export { BOX_WIDTH };

const styles = StyleSheet.create({
  item: {
    width: BOX_WIDTH,
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
  },
});
