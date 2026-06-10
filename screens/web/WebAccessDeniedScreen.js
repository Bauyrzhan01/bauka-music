import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function WebAccessDeniedScreen({ onLogout }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Доступ запрещён</Text>
      <Text style={styles.text}>
        Веб-версия доступна только администратору.{'\n'}
        Войдите с учётной записью admin или используйте приложение на телефоне.
      </Text>
      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Выйти</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#0b0b12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
});
