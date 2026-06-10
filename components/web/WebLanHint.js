import { useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { API_PORT } from '../../constants/api';

function isOnLaptopLocalhost() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export default function WebLanHint() {
  const [lanIps, setLanIps] = useState([]);
  const [apiOnline, setApiOnline] = useState(true);
  const webPort =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.port || '8081'
      : '8081';

  useEffect(() => {
    if (!isOnLaptopLocalhost()) return undefined;

    let cancelled = false;

    fetch(`http://127.0.0.1:${API_PORT}/api/network`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setLanIps(data.lanIps || []);
          setApiOnline(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLanIps([]);
          setApiOnline(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isOnLaptopLocalhost()) return null;

  const phoneUrl = lanIps[0]
    ? `http://${lanIps[0]}:${webPort}`
    : null;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>С телефона в той же Wi‑Fi</Text>
      <Text style={styles.text}>
        Cursor открывает только ноутбук:{' '}
        <Text style={styles.mono}>http://localhost:{webPort}</Text>
        {'\n'}
        На телефоне localhost не работает — нужен IP ноутбука.
      </Text>

      {phoneUrl ? (
        <>
          <Text style={styles.label}>Откройте в браузере телефона:</Text>
          <Text style={styles.url} selectable>
            {phoneUrl}
          </Text>
        </>
      ) : (
        <Text style={styles.warn}>
          {apiOnline
            ? 'IP Wi‑Fi не найден. Запустите npm start и проверьте сеть.'
            : 'API не запущен. В терминале: Ctrl+C → npm start'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#c5d4ff',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a3a8a',
  },
  text: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    color: '#333',
  },
  url: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'monospace',
  },
  warn: {
    marginTop: 8,
    fontSize: 12,
    color: '#a60',
  },
});
