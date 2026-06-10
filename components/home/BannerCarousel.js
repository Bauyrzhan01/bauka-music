import { useRef, useState } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useBanners } from '../../context/BannersContext';
import BannerCard, { HORIZONTAL_PADDING } from './BannerCard';

export default function BannerCarousel({ onBannerPress }) {
  const { activeBanners } = useBanners();
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  if (activeBanners.length === 0) {
    return null;
  }

  const updateIndex = (offsetX) => {
    const index = Math.round(offsetX / screenWidth);
    const safeIndex = Math.max(0, Math.min(index, activeBanners.length - 1));
    setActiveIndex(safeIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={activeBanners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={(e) => updateIndex(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => updateIndex(e.nativeEvent.contentOffset.x)}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: screenWidth }]}>
            <BannerCard
              banner={item}
              onPress={() => onBannerPress?.(item)}
            />
          </View>
        )}
      />

      {activeBanners.length > 1 ? (
        <View style={styles.dots}>
          {activeBanners.map((banner, index) => (
            <View
              key={banner.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  page: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  dotActive: {
    backgroundColor: '#000',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
