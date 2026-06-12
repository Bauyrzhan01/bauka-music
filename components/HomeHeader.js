import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_NAME } from '../constants/appBrand';

const ICON_SIZE = 26;

export default function HomeHeader({ onAdd, onSearch, dark = false, overlay = false }) {
  return (
    <View
      style={[
        styles.header,
        dark && !overlay && styles.headerDark,
        overlay && styles.headerOverlay,
      ]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.addBtn} onPress={onAdd} hitSlop={8}>
        <LinearGradient
          colors={['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addRing}
        >
          <View style={styles.addInner}>
            <Ionicons name="add" size={22} color="#fff" />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.logoRow}>
        <Ionicons
          name="sparkles"
          size={20}
          color="#8ecbff"
          style={[styles.logoIcon, overlay && styles.logoIconShadow]}
        />
        <Text style={[styles.logo, overlay && styles.logoShadow]}>{APP_NAME}</Text>
      </View>

      <Pressable onPress={onSearch} accessibilityLabel="Поиск" hitSlop={8}>
        <Ionicons
          name="search"
          size={ICON_SIZE}
          color={dark ? '#fff' : '#111'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerDark: {
    backgroundColor: '#000',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  logoShadow: {
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  logoIconShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 6,
  },
  logo: {
    fontSize: 21,
    fontWeight: '800',
    color: '#8ecbff',
    letterSpacing: 0.2,
  },
});
