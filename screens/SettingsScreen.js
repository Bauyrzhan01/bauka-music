import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useMusicCatalog } from '../context/MusicCatalogContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { isStandaloneApp } from '../constants/standalone';
import { checkApiHealth } from '../api/checkApiHealth';
import {
  ensureApiBaseOverrideLoaded,
  getApiBaseUrl,
  getApiBaseUrlSource,
  setRuntimeApiBaseUrl,
  resetApiBaseOverride,
} from '../constants/api';
import {
  loadApiBaseOverride,
  saveApiBaseOverride,
} from '../storage/apiBaseStorage';
import { useOsBack } from '../hooks/useOsBack';
import LocalAdminScreen from './LocalAdminScreen';

export default function SettingsScreen({
  onBack,
  onOpenKaraoke,
  onEditTrack,
  onNavigate,
}) {
  useOsBack(onBack);
  const standalone = isStandaloneApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const { logout } = useAuth();
  const { refreshCatalog } = useMusicCatalog();
  const { hideBundledTracks, setHideBundledTracks } = useAppPreferences();
  const [apiUrl, setApiUrl] = useState('');
  const [status, setStatus] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (standalone) return;
    (async () => {
      await ensureApiBaseOverrideLoaded();
      const saved = await loadApiBaseOverride();
      setApiUrl(saved || getApiBaseUrl());
      setStatus(`Источник: ${getApiBaseUrlSource()}`);
    })();
  }, [standalone]);

  const handleTest = async () => {
    setChecking(true);
    setStatus('');
    const base = apiUrl.trim().replace(/\/$/, '');
    try {
      await checkApiHealth(base);
      setRuntimeApiBaseUrl(base);
      await saveApiBaseOverride(base);
      setStatus(`OK: ${base}`);
      await refreshCatalog();
    } catch (err) {
      setStatus(err.message || 'Сервер недоступен');
    } finally {
      setChecking(false);
    }
  };

  const handleReset = async () => {
    await saveApiBaseOverride('');
    resetApiBaseOverride();
    await ensureApiBaseOverrideLoaded();
    setApiUrl(getApiBaseUrl());
    setStatus(`Сброшено. Сейчас: ${getApiBaseUrl()} (${getApiBaseUrlSource()})`);
    await refreshCatalog();
  };

  if (showAdmin) {
    return (
      <LocalAdminScreen
        onBack={() => setShowAdmin(false)}
        onNavigate={(tab, preset) => {
          setShowAdmin(false);
          onBack?.();
          onNavigate?.(tab, preset);
        }}
        onEditTrack={(trackId) => {
          setShowAdmin(false);
          onBack?.();
          onEditTrack?.(trackId);
        }}
        onOpenKaraoke={(trackId) => {
          setShowAdmin(false);
          onBack?.();
          onOpenKaraoke?.(trackId);
        }}
      />
    );
  }

  const handleResetProfile = () => {
    Alert.alert(
      'Сбросить профиль?',
      'Имя и аватар вернутся к значениям по умолчанию. Музыка на телефоне не удалится.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Назад">
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Параметры</Text>
        {standalone ? (
          <View style={styles.infoBox}>
            <Ionicons name="phone-portrait-outline" size={22} color="#ffffff" />
            <Text style={styles.infoTitle}>Локальный режим</Text>
            <Text style={styles.infoText}>
              Приложение работает без сервера. Музыка, тексты, клипы и видео
              хранятся только на этом телефоне.
            </Text>
          </View>
        ) : null}

        {standalone ? null : (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Библиотека</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Только моя музыка</Text>
                <Text style={styles.switchHint}>
                  Скрыть встроенные треки из каталога и поиска
                </Text>
              </View>
              <Switch
                value={hideBundledTracks}
                onValueChange={setHideBundledTracks}
              />
            </View>
          </View>
        )}

        {!standalone ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Сервер API</Text>
            <Text style={styles.apiHint}>
              Только для синхронизации каталога и рилсов с сервера.
            </Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.0.10:3001"
            />
            <View style={styles.apiActions}>
              <Pressable
                style={styles.testBtn}
                onPress={handleTest}
                disabled={checking}
              >
                {checking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>Проверить</Text>
                )}
              </Pressable>
              <Pressable style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Авто</Text>
              </Pressable>
            </View>
            {status ? <Text style={styles.status}>{status}</Text> : null}
          </View>
        ) : null}

        {standalone ? (
          <Pressable
            style={styles.adminBtn}
            onPress={() => setShowAdmin(true)}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />
            <Text style={styles.adminBtnText}>Админка</Text>
            <Ionicons name="chevron-forward" size={18} color="#888888" />
          </Pressable>
        ) : null}

        <Pressable style={styles.resetProfileBtn} onPress={handleResetProfile}>
          <Text style={styles.resetProfileText}>Сбросить профиль</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  content: {
    paddingBottom: 32,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#2b2b2b',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoText: {
    fontSize: 13,
    color: '#9a9a9a',
    lineHeight: 19,
  },
  block: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#333333',
    gap: 8,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  switchHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#9a9a9a',
    lineHeight: 17,
  },
  apiHint: {
    fontSize: 12,
    color: '#9a9a9a',
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
  },
  apiActions: {
    flexDirection: 'row',
    gap: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  resetBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  status: {
    fontSize: 12,
    color: '#9a9a9a',
    lineHeight: 17,
  },
  adminBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  adminBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetProfileBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    backgroundColor: '#2a1515',
  },
  resetProfileText: {
    color: '#c00',
    fontWeight: '600',
  },
});
