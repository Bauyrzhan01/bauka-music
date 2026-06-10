import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import AuthBackground from '../../components/auth/AuthBackground';
import WebPhoneAccessGuide from '../../components/web/WebPhoneAccessGuide';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

export default function WebAdminLoginScreen() {
  const { isMobile } = useWebBreakpoint();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError('');
    setLoading(true);
    const result = login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.user?.role !== 'admin') {
      logout();
      setError('Веб-доступ только для администратора');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuthBackground />
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ADMIN</Text>
          </View>
          <Text style={styles.subtitle}>Панель администратора</Text>

          <Text style={styles.label}>Email администратора</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@gmail.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Войти в админку</Text>
            )}
          </Pressable>

          <WebPhoneAccessGuide variant="compact" />

          <Text style={styles.note}>
            Веб-версия только для администратора.{'\n'}
            Пользователи — приложение на телефоне.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0b12',
    minHeight: '100vh',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#c00',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 10,
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
  note: {
    marginTop: 20,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
