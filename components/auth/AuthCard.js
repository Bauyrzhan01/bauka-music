import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function AuthCard({
  mode,
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}) {
  const isLogin = mode === 'login';

  return (
    <View style={styles.card}>
      <Text style={styles.logo}>Bauka Music</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={onEmailChange}
        placeholder="email@example.com"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text style={styles.label}>Пароль</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={onPasswordChange}
        placeholder="••••••••"
        placeholderTextColor="#999"
        secureTextEntry
        autoComplete={isLogin ? 'password' : 'password-new'}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={onSwitchMode} style={styles.switch}>
        <Text style={styles.switchText}>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <Text style={styles.switchLink}>
            {isLogin ? 'Регистрация' : 'Вход'}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#c00',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switch: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchLink: {
    color: '#111',
    fontWeight: '600',
  },
});
