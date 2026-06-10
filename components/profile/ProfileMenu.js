import { View, StyleSheet } from 'react-native';
import ProfileMenuItem from './ProfileMenuItem';

const MENU_ITEMS = [
  { id: 'edit', icon: 'create-outline', label: 'Редактировать профиль' },
  { id: 'settings', icon: 'settings-outline', label: 'Настройки' },
  { id: 'favorites', icon: 'heart-outline', label: 'Избранное' },
  { id: 'history', icon: 'time-outline', label: 'История прослушивания' },
];

export default function ProfileMenu({ onItemPress, onLogout }) {
  return (
    <View style={styles.container}>
      {MENU_ITEMS.map((item) => (
        <ProfileMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          onPress={() => onItemPress(item.id)}
        />
      ))}
      <ProfileMenuItem
        icon="log-out-outline"
        label="Выйти"
        onPress={onLogout}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
