import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoriteButton({
  trackId,
  size = 24,
  color = '#999',
  activeColor = '#111',
  onPress,
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(trackId);

  const handlePress = () => {
    if (trackId) {
      toggleFavorite(trackId);
    }
    onPress?.();
  };

  if (!trackId) return null;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityLabel={active ? 'Убрать из избранного' : 'В избранное'}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? activeColor : color}
      />
    </Pressable>
  );
}
