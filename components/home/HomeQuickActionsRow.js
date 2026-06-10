import { View, StyleSheet } from 'react-native';
import { useAlbums } from '../../context/AlbumsContext';
import { isStandaloneApp } from '../../constants/standalone';
import HomeQuickTile from './HomeQuickTile';

export default function HomeQuickActionsRow({
  onOpenFavorites,
  onOpenAlbums,
  onOpenMyMusic,
}) {
  const { albums, albumCount } = useAlbums();
  const firstAlbum = albums[0];
  const standalone = isStandaloneApp();

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <View style={styles.grid}>
        {standalone ? null : (
          <HomeQuickTile
            title="Моя музыка"
            onPress={onOpenMyMusic}
            coverColor="#111"
            icon="musical-notes"
            iconColor="#fff"
          />
        )}
        <HomeQuickTile
          title="Любимые треки"
          onPress={onOpenFavorites}
          coverColor="#450af5"
          icon="heart"
          iconColor="#fff"
        />
        {albumCount > 0 ? (
          <HomeQuickTile
            title="Альбомы"
            onPress={onOpenAlbums}
            coverUri={firstAlbum?.authorAvatarUrl}
            coverColor="#333333"
            icon={firstAlbum?.authorAvatarUrl ? undefined : 'albums'}
            iconColor="#ddd"
          />
        ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  panel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111',
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
});
