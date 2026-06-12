import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileMenuItem({ icon, label, onPress, danger }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? '#c00' : '#000'}
      />
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#888888" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  labelDanger: {
    color: '#c00',
  },
});
