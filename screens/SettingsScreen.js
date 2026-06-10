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
} from 'react-native';
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>Настройки</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {standalone ? (
          <View style={styles.infoBox}>
            <Ionicons name="phone-portrait-outline" size={22} color="#111" />
            <Text style={styles.infoTitle}>Локальный режим</Text>
            <Text style={styles.infoText}>
              Приложение работает без сервера. Музыка, тексты, клипы и видео
              хранятся только на этом телефоне.
            </Text>
          </View>
        ) : null}

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
            <Ionicons name="shield-checkmark-outline" size={20} color="#111" />
            <Text style={styles.adminBtnText}>Админка</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </Pressable>
        ) : null}

        <Pressable style={styles.resetProfileBtn} onPress={logout}>
          <Text style={styles.resetProfileText}>Сбросить профиль</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 32,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
  block: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f4f4f5',
    gap: 8,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    color: '#111',
  },
  switchHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#888',
    lineHeight: 17,
  },
  apiHint: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  apiActions: {
    flexDirection: 'row',
    gap: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#111',
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
    borderColor: '#111',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#444',
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
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  adminBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  resetProfileBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
  },
  resetProfileText: {
    color: '#c00',
    fontWeight: '600',
  },
});
