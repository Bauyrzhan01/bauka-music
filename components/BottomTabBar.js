import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { key: 'Main', icon: 'musical-notes', activeIcon: 'musical-notes' },
  { key: 'MyMusic', icon: 'library-outline', activeIcon: 'library' },
  { key: 'Favorites', icon: 'heart-outline', activeIcon: 'heart' },
  { key: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive =
          tab.key === 'Main'
            ? activeTab === 'Main'
            : tab.key === 'MyMusic'
              ? activeTab === 'MyMusic'
              : tab.key === 'Favorites'
                ? activeTab === 'Favorites'
                : activeTab === 'Profile';

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            accessibilityLabel={tab.key}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={26}
              color={isActive ? '#fff' : '#666'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 0,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
