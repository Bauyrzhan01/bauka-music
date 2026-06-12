import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../context/FavoritesContext';

const HORIZONTAL_PADDING = 16;

export default function FavoritesHomeCard({ onOpen }) {
  const { favoriteCount } = useFavorites();

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={onOpen}>
        <View style={styles.iconWrap}>
          <Ionicons name="heart" size={22} color="#ffffff" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Избранное</Text>
          <Text style={styles.subtitle}>
            {favoriteCount === 0
              ? 'Сохраняйте любимые треки'
              : `${favoriteCount} ${
                  favoriteCount === 1 ? 'трек' : 'треков'
                }`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#888888" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#9a9a9a',
    marginTop: 2,
  },
});
