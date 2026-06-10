import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export default function TrackCover({
  coverUrl,
  size = 148,
  borderRadius = 12,
  iconSize = 32,
  style,
}) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="musical-note" size={iconSize} color="#111" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#111',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
