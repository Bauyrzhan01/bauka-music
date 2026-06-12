import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';
import WebPhoneAccessGuide from './WebPhoneAccessGuide';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Обзор', icon: 'grid-outline' },
  { id: 'analytics', label: 'Аналитика', icon: 'stats-chart-outline' },
  { id: 'categories', label: 'Категории', icon: 'albums-outline' },
  { id: 'music', label: 'Музыка', icon: 'musical-notes-outline' },
  { id: 'authors', label: 'Авторы', icon: 'people-outline' },
];

function NavList({ activeSection, onSectionChange, onNavigate, compact }) {
  return (
    <View style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = activeSection === item.id;
        return (
          <Pressable
            key={item.id}
            style={[
              styles.navItem,
              compact && styles.navItemCompact,
              active && styles.navItemActive,
            ]}
            onPress={() => {
              onSectionChange(item.id);
              onNavigate?.();
            }}
          >
            <Ionicons
              name={item.icon}
              size={compact ? 22 : 20}
              color={active ? '#fff' : '#aaa'}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function WebAdminLayout({
  activeSection,
  onSectionChange,
  userEmail,
  onLogout,
  children,
}) {
  const { isMobile, contentPadding, touchMinHeight } = useWebBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'Админка';

  const closeMenu = () => setMenuOpen(false);

  const sidebarContent = (
    <>
      <View>
        <Text style={styles.logo}>Tolqyn</Text>
        <Text style={styles.logoSub}>Admin Panel</Text>
        <NavList
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onNavigate={isMobile ? closeMenu : undefined}
          compact={isMobile}
        />
      </View>

      {!isMobile ? <WebPhoneAccessGuide variant="sidebar" /> : null}

      <View style={styles.sidebarFooter}>
        <Text style={styles.userEmail} numberOfLines={1}>
          {userEmail}
        </Text>
        <Pressable
          style={[styles.logoutBtn, { minHeight: touchMinHeight }]}
          onPress={() => {
            closeMenu();
            onLogout();
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={[styles.root, isMobile ? styles.rootMobile : styles.rootDesktop]}>
      {isMobile ? (
        <>
          <View style={styles.mobileHeader}>
            <Pressable
              style={styles.menuBtn}
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
            >
              <Ionicons name="menu" size={26} color="#111" />
            </Pressable>
            <Text style={styles.mobileTitle} numberOfLines={1}>
              {activeLabel}
            </Text>
            <Pressable style={styles.menuBtn} onPress={onLogout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={24} color="#111" />
            </Pressable>
          </View>

          {menuOpen ? (
            <Pressable style={styles.overlay} onPress={closeMenu} />
          ) : null}

          <View
            style={[
              styles.drawer,
              menuOpen ? styles.drawerOpen : styles.drawerClosed,
            ]}
          >
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerInner}
              showsVerticalScrollIndicator={false}
            >
              {sidebarContent}
            </ScrollView>
          </View>
        </>
      ) : (
        <View style={styles.sidebar}>{sidebarContent}</View>
      )}

      <View style={styles.main}>
        <View style={[styles.content, { padding: contentPadding }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

export { NAV_ITEMS };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#f4f4f5',
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : {}),
  },
  rootDesktop: {
    flexDirection: 'row',
  },
  rootMobile: {
    flexDirection: 'column',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    zIndex: 50,
    ...(Platform.OS === 'web'
      ? { position: 'sticky', top: 0 }
      : {}),
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
    marginHorizontal: 8,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 90,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 56,
    bottom: 0,
    width: 'min(300px, 88vw)',
    maxWidth: 300,
    backgroundColor: '#111',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerOpen: {
    transform: [{ translateX: 0 }],
  },
  drawerClosed: {
    transform: [{ translateX: -320 }],
    pointerEvents: 'none',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerInner: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#111',
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  logoSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 24,
  },
  nav: {
    gap: 4,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  navItemCompact: {
    paddingVertical: 14,
  },
  navItemActive: {
    backgroundColor: '#333',
  },
  navLabel: {
    color: '#aaa',
    fontSize: 15,
  },
  navLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    gap: 12,
    marginTop: 24,
  },
  userEmail: {
    color: '#888',
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
});
