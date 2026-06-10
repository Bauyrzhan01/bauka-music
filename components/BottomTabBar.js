import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { key: 'Main', label: 'Главная', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Search', label: 'Поиск', icon: 'search-outline', activeIcon: 'search' },
  { key: 'Profile', label: 'Профиль', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const focused = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Ionicons
              name={focused ? tab.activeIcon : tab.icon}
              size={24}
              color={focused ? '#000' : '#888'}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  labelActive: {
    color: '#000',
  },
});
