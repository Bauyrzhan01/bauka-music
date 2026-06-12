import { View, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import HomeHeader from '../components/HomeHeader';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <HomeHeader
        accountName={user?.name}
        onProfile={() => {}}
        onSearch={() => {}}
        onNotifications={() => {}}
      />
      <View style={styles.content} />
      <View style={styles.footer}>
        <Button title="Выйти" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
  },
});
