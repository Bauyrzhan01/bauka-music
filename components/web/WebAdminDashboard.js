import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MUSIC_CATEGORIES } from '../../data/categories';
import { fetchMusicCatalog } from '../../api/musicApi';
import { fetchAuthors } from '../../api/authorsApi';
import { useWebBreakpoint } from '../../hooks/useWebBreakpoint';
import WebPhoneAccessGuide from './WebPhoneAccessGuide';

export default function WebAdminDashboard() {
  const { isMobile, pageTitleSize } = useWebBreakpoint();
  const [trackCount, setTrackCount] = useState(0);
  const [authorCount, setAuthorCount] = useState(0);

  useEffect(() => {
    fetchMusicCatalog()
      .then((data) => setTrackCount(data.tracks?.length ?? 0))
      .catch(() => setTrackCount(0));
    fetchAuthors()
      .then((authors) => setAuthorCount(authors.length))
      .catch(() => setAuthorCount(0));
  }, []);

  const stats = [
    { label: 'Треков', value: trackCount },
    { label: 'Авторов', value: authorCount },
    { label: 'Категорий', value: MUSIC_CATEGORIES.length },
  ];

  return (
    <View>
      <Text style={[styles.pageTitle, { fontSize: pageTitleSize }]}>Обзор</Text>
      <Text style={styles.pageSubtitle}>
        Управление контентом приложения Bauka Music
      </Text>

      <WebPhoneAccessGuide variant={isMobile ? 'compact' : 'full'} />

      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.card, isMobile && styles.cardMobile]}
          >
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text style={styles.cardLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Как это работает</Text>
        <Text style={styles.infoText}>
          • На главной в приложении — «Моя волна» (микс из ваших треков){'\n'}
          • «Музыка» — загрузка и текст треков, «Авторы» — страницы исполнителей{'\n'}
          • Запускайте проект: npm start (API + Expo){'\n'}
          • Телефон и ПК должны быть в одной Wi‑Fi сети
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 160,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardMobile: {
    minWidth: 0,
    flex: 0,
    width: '100%',
    padding: 18,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});
