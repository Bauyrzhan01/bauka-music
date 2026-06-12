import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useMusicCatalog } from '../../context/MusicCatalogContext';
import { usePlayer } from '../../context/PlayerContext';
import { getSimilarTracks } from '../../utils/getSimilarTracks';
import { enrichTrackWithCover } from '../../utils/trackCoverUrl';
import TrackCover from '../TrackCover';

export default function PlayerCoverCarousel({
  baseTrack,
  coverUrl,
  artSize,
  screenWidth,
}) {
  const { tracks: catalogTracks } = useMusicCatalog();
  const {
    previousTracks,
    upcomingTracks,
    playlistTracks,
    playTrack,
  } = usePlayer();

  const listRef = useRef(null);
  const skipScrollPlayRef = useRef(false);
  const settledIndexRef = useRef(0);
  const pageWidth = screenWidth;

  const { items, currentIndex } = useMemo(() => {
    const prev = previousTracks.map((track) => enrichTrackWithCover(track));
    const current = enrichTrackWithCover({
      ...baseTrack,
      coverUrl: coverUrl || baseTrack.coverUrl,
    });

    const nextSource =
      upcomingTracks.length > 0
        ? upcomingTracks
        : getSimilarTracks(baseTrack, catalogTracks, 24);

    const next = nextSource
      .filter((track) => track.id !== baseTrack.id)
      .map((track) => enrichTrackWithCover(track));

    const list = [...prev, current, ...next];
    return { items: list, currentIndex: prev.length };
  }, [
    previousTracks,
    upcomingTracks,
    baseTrack,
    coverUrl,
    catalogTracks,
  ]);

  const scrollToCurrent = useCallback(
    (animated) => {
      if (!listRef.current || currentIndex < 0) return;
      skipScrollPlayRef.current = true;
      listRef.current.scrollToOffset({
        offset: currentIndex * pageWidth,
        animated,
      });
      setTimeout(() => {
        skipScrollPlayRef.current = false;
      }, animated ? 350 : 50);
    },
    [currentIndex, pageWidth]
  );

  useEffect(() => {
    settledIndexRef.current = currentIndex;
    scrollToCurrent(false);
  }, [baseTrack?.id, currentIndex, scrollToCurrent]);

  const handlePageSettled = useCallback(
    (offsetX) => {
      if (skipScrollPlayRef.current) return;

      const index = Math.round(offsetX / pageWidth);
      if (index === settledIndexRef.current) return;

      const track = items[index];
      if (!track?.id) return;

      settledIndexRef.current = index;
      if (track.id !== baseTrack?.id) {
        playTrack(track, playlistTracks);
      }
    },
    [baseTrack?.id, items, pageWidth, playTrack, playlistTracks]
  );

  const onMomentumScrollEnd = useCallback(
    (event) => {
      handlePageSettled(event.nativeEvent.contentOffset.x);
    },
    [handlePageSettled]
  );

  const onScrollEndDrag = useCallback(
    (event) => {
      const velocity = event.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(velocity) > 0.05) return;
      handlePageSettled(event.nativeEvent.contentOffset.x);
    },
    [handlePageSettled]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={[styles.page, { width: pageWidth, height: artSize }]}>
        <View style={[styles.artwork, { width: artSize, height: artSize }]}>
          <TrackCover
            coverUrl={item.coverUrl}
            size={artSize}
            borderRadius={6}
            iconSize={64}
          />
        </View>
      </View>
    ),
    [artSize, pageWidth]
  );

  if (!baseTrack) return null;

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      disableIntervalMomentum
      nestedScrollEnabled
      bounces={false}
      overScrollMode="never"
      style={{ width: pageWidth, height: artSize }}
      getItemLayout={(_, index) => ({
        length: pageWidth,
        offset: pageWidth * index,
        index,
      })}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScrollEndDrag={onScrollEndDrag}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
