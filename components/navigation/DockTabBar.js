import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  {
    key: 'Main',
    icon: 'home-outline',
    activeIcon: 'home',
    label: 'Главная',
  },
  {
    key: 'MyMusic',
    icon: 'musical-notes-outline',
    activeIcon: 'musical-notes',
    label: 'Моя музыка',
  },
  {
    key: 'Favorites',
    icon: 'heart-outline',
    activeIcon: 'heart',
    label: 'Избранное',
  },
  {
    key: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    label: 'Профиль',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function isTabActive(tabKey, activeTab) {
  if (tabKey === 'Main') return activeTab === 'Main';
  if (tabKey === 'MyMusic') return activeTab === 'MyMusic';
  if (tabKey === 'Favorites') return activeTab === 'Favorites';
  return activeTab === 'Profile';
}

function DockTabButton({ tab, isActive, onPress }) {
  const scale = useSharedValue(isActive ? 1.06 : 1);
  const lift = useSharedValue(isActive ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.06 : 1, {
      damping: 14,
      stiffness: 320,
    });
    lift.value = withSpring(isActive ? -2 : 0, {
      damping: 14,
      stiffness: 320,
    });
  }, [isActive, lift, scale]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.tabBtn, isActive && styles.tabBtnActive, buttonStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 16, stiffness: 420 });
        lift.value = withSpring(-2, { damping: 16, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(isActive ? 1.06 : 1, {
          damping: 14,
          stiffness: 320,
        });
        lift.value = withSpring(isActive ? -2 : 0, {
          damping: 14,
          stiffness: 320,
        });
      }}
      accessibilityLabel={tab.label}
    >
      <Ionicons
        name={isActive ? tab.activeIcon : tab.icon}
        size={24}
        color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
      />
      <Text
        style={[styles.tabLabel, isActive && styles.tabLabelActive]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

export default function DockTabBar({ activeTab, onTabPress }) {
  const dockContent = (
    <View style={styles.dockRow}>
      {TABS.map((tab) => (
        <DockTabButton
          key={tab.key}
          tab={tab}
          isActive={isTabActive(tab.key, activeTab)}
          onPress={() => onTabPress(tab.key)}
        />
      ))}
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <View style={styles.dockShellWeb}>{dockContent}</View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <BlurView intensity={48} tint="dark" style={styles.dockShell}>
        <View style={styles.dockInner}>{dockContent}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  dockShell: {
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dockShellWeb: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(18,18,18,0.92)',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  dockInner: {
    width: '100%',
    backgroundColor: 'rgba(18,18,18,0.55)',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    minHeight: 72,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: 'rgba(255,255,255,0.92)',
  },
});
