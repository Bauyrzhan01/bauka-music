import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={14} color="#ffffff" />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileStatsSection({
  favoritesCount,
  offlineCount,
  recentCount,
  reelsCount = 0,
}) {
  return (
    <View style={styles.wrap}>
      <StatCard icon="heart" value={favoritesCount} label="Избран." />
      <StatCard icon="videocam-outline" value={reelsCount} label="Reels" />
      <StatCard icon="cloud-done-outline" value={offlineCount} label="Офлайн" />
      <StatCard icon="time-outline" value={recentCount} label="Недавн." />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  label: {
    fontSize: 9,
    color: '#9a9a9a',
    fontWeight: '500',
    textAlign: 'center',
  },
});
