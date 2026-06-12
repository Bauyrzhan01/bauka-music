import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const HORIZONTAL_PADDING = 16;

export default function BannerCard({ banner, onPress }) {
  if (!banner.imageUri) return null;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={{ uri: banner.imageUri }}
        style={styles.image}
        contentFit="cover"
      />
    </Pressable>
  );
}

export { HORIZONTAL_PADDING };

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 148,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2b2b2b',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
