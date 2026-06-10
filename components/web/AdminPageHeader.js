import { View, Text, StyleSheet } from 'react-native';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function AdminPageHeader({ title, subtitle, children }) {
  const { isMobile, pageTitleSize } = useWebBreakpoint();

  return (
    <View style={[styles.header, isMobile && styles.headerMobile]}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { fontSize: pageTitleSize }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children ? (
        <View style={[styles.actions, isMobile && styles.actionsMobile]}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap',
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexShrink: 0,
  },
  actionsMobile: {
    width: '100%',
  },
});
