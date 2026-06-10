import { useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { API_PORT, getApiBaseUrl } from '../../constants/api';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';

function getWebPort() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.port || '8081';
  }
  return '8081';
}

function isLocalhost() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function Step({ number, children }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

export default function WebPhoneAccessGuide({ variant = 'full' }) {
  const { isMobile } = useWebBreakpoint();
  const [lanIps, setLanIps] = useState([]);
  const [apiOnline, setApiOnline] = useState(null);
  const webPort = getWebPort();
  const onPhone = Platform.OS === 'web' && !isLocalhost();
  const currentHost =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.hostname
      : '';

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const base = isLocalhost()
      ? `http://127.0.0.1:${API_PORT}`
      : getApiBaseUrl();

    let cancelled = false;

    fetch(`${base}/api/network`)
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

  if (Platform.OS !== 'web') return null;

  const primaryIp = lanIps[0];
  const phoneAdminUrl = primaryIp
    ? `http://${primaryIp}:${webPort}`
    : null;
  const phoneApiUrl = primaryIp
    ? `http://${primaryIp}:${API_PORT}`
    : null;
  const laptopUrl = `http://localhost:${webPort}`;

  if (onPhone) {
    return (
      <View style={[styles.box, styles.boxSuccess, variant === 'sidebar' && styles.boxSidebar]}>
        <Text style={styles.titleSuccess}>Админка открыта с телефона</Text>
        <Text style={styles.text}>
          Вы зашли по IP ноутбука — всё настроено правильно.
        </Text>
        <Text style={styles.ipLabel}>Текущий адрес</Text>
        <Text style={styles.ipBig} selectable>
          {typeof window !== 'undefined' ? window.location.origin : ''}
        </Text>
        {lanIps.length > 0 ? (
          <Text style={styles.textSmall}>
            IP ноутбука в сети: {lanIps.join(', ')}
          </Text>
        ) : null}
      </View>
    );
  }

  if (variant === 'sidebar') {
    return (
      <View style={[styles.box, styles.boxSidebar]}>
        <Text style={styles.sidebarTitle}>Телефон</Text>
        {primaryIp ? (
          <>
            <Text style={styles.sidebarIp} selectable>
              {primaryIp}
            </Text>
            <Text style={styles.sidebarUrl} selectable numberOfLines={2}>
              {phoneAdminUrl}
            </Text>
          </>
        ) : (
          <Text style={styles.warn}>
            {apiOnline === false ? 'API выключен' : 'IP…'}
          </Text>
        )}
        <Text style={styles.sidebarHint}>
          В браузере телефона — этот адрес, не localhost
        </Text>
      </View>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <View
      style={[
        styles.box,
        isCompact && styles.boxCompact,
        isMobile && styles.boxMobile,
      ]}
    >
      <Text style={styles.title}>Как открыть админку с телефона</Text>
      <Text style={styles.lead}>
        Cursor и «Open Browser» открывают только ноутбук. На телефоне нужен
        IP вашего ноутбука в Wi‑Fi.
      </Text>

      <View style={styles.ipCard}>
        <Text style={styles.ipLabel}>IP ноутбука (Wi‑Fi)</Text>
        {primaryIp ? (
          <Text
            style={[styles.ipBig, isMobile && styles.ipBigMobile]}
            selectable
          >
            {primaryIp}
          </Text>
        ) : (
          <Text style={styles.ipMissing}>
            {apiOnline === false
              ? 'Не найден — запустите npm start'
              : 'Загрузка…'}
          </Text>
        )}
        {lanIps.length > 1 ? (
          <Text style={styles.textSmall}>
            Все адреса: {lanIps.join(', ')}
          </Text>
        ) : null}
      </View>

      <View style={styles.urlBlock}>
        <Text style={styles.urlBlockTitle}>На ноутбуке (сейчас)</Text>
        <Text style={styles.urlMono} selectable>
          {laptopUrl}
        </Text>
        <Text style={styles.urlHint}>Так открывает Cursor — только на ПК</Text>
      </View>

      <View style={[styles.urlBlock, styles.urlBlockPhone]}>
        <Text style={styles.urlBlockTitle}>На телефоне (Safari / Chrome)</Text>
        {phoneAdminUrl ? (
          <Text style={styles.urlMonoLarge} selectable>
            {phoneAdminUrl}
          </Text>
        ) : (
          <Text style={styles.warn}>Сначала запустите npm start на ноутбуке</Text>
        )}
        <Text style={styles.urlHint}>
          Скопируйте и вставьте в браузер телефона. localhost на телефоне не
          работает.
        </Text>
      </View>

      {!isCompact ? (
        <>
          <Text style={styles.stepsTitle}>Пошаговая инструкция</Text>

          <Step number={1}>
            На ноутбуке в терминале проекта выполните: npm start. Должны
            запуститься API (порт {API_PORT}) и Expo (порт {webPort}).
          </Step>
          <Step number={2}>
            Подключите телефон и ноутбук к одной сети Wi‑Fi (не мобильный
            интернет только на телефоне).
          </Step>
          <Step number={3}>
            На телефоне откройте браузер и введите адрес из блока «На телефоне»
            выше (с IP {primaryIp || 'ноутбука'}).
          </Step>
          <Step number={4}>
            Войдите как администратор: admin@gmail.com и ваш пароль.
          </Step>
          <Step number={5}>
            Проверка: если страница не грузится, на телефоне откройте{' '}
            {phoneApiUrl ? (
              <Text style={styles.inlineMono} selectable>
                {phoneApiUrl}/api/health
              </Text>
            ) : (
              'http://IP:3001/api/health'
            )}
            {' '}— должно показать ok и version 2.
          </Step>
          <Step number={6}>
            Windows: если не открывается — в брандмауэре разрешите Node.js для
            частной сети (порты {webPort} и {API_PORT}).
          </Step>

          <View style={styles.faqBox}>
            <Text style={styles.faqTitle}>Почему не работает localhost?</Text>
            <Text style={styles.faqText}>
              localhost — это «этот же аппарат». На ноутбуке localhost = ноутбук.
              На телефоне localhost = телефон, а админка и API работают на
              ноутбуке. Поэтому с телефона всегда используйте IP ноутбука.
            </Text>
          </View>

          <View style={styles.faqBox}>
            <Text style={styles.faqTitle}>Приложение для пользователей</Text>
            <Text style={styles.faqText}>
              Обычные пользователи заходят через Expo Go / сборку приложения, не
              через браузер. Веб-админка — только для администратора.
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#b8c9f0',
    marginBottom: 24,
  },
  boxCompact: {
    padding: 16,
    marginBottom: 16,
  },
  boxMobile: {
    marginBottom: 16,
  },
  boxSuccess: {
    backgroundColor: '#ecfdf3',
    borderColor: '#86efac',
  },
  boxSidebar: {
    marginTop: 16,
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#1a1a22',
    borderColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3a8a',
    marginBottom: 8,
  },
  titleSuccess: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  lead: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
    marginBottom: 16,
  },
  ipCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#1a3a8a',
  },
  ipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ipBig: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    fontFamily: 'monospace',
  },
  ipBigMobile: {
    fontSize: 22,
  },
  ipMissing: {
    fontSize: 16,
    color: '#a60',
    fontWeight: '600',
  },
  urlBlock: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dde4f5',
  },
  urlBlockPhone: {
    borderColor: '#1a3a8a',
    borderWidth: 2,
  },
  urlBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  urlMono: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#555',
  },
  urlMonoLarge: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#111',
    lineHeight: 24,
  },
  urlHint: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
    lineHeight: 17,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    color: '#111',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
  },
  inlineMono: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#1a3a8a',
  },
  faqBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  faqText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  text: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  textSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  warn: {
    fontSize: 13,
    color: '#a60',
    fontWeight: '600',
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sidebarIp: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  sidebarUrl: {
    fontSize: 11,
    color: '#7eb8ff',
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  sidebarHint: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    lineHeight: 14,
  },
});
