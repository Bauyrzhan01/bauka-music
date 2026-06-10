import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import WebAdminLayout from '../../components/web/WebAdminLayout';
import WebAdminDashboard from '../../components/web/WebAdminDashboard';
import WebAdminCategories from '../../components/web/WebAdminCategories';
import WebAdminMusic from '../../components/web/WebAdminMusic';
import WebAdminAuthors from '../../components/web/WebAdminAuthors';
import WebAdminAuthorPage from '../../components/web/WebAdminAuthorPage';
import WebAdminTrackEdit from '../../components/web/WebAdminTrackEdit';
import WebAdminAnalytics from '../../components/web/WebAdminAnalytics';

export default function WebAdminPanel() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [authorId, setAuthorId] = useState(null);
  const [musicEditTrack, setMusicEditTrack] = useState(null);
  const [authorRefresh, setAuthorRefresh] = useState(0);

  const openAuthor = (id) => {
    setMusicEditTrack(null);
    setAuthorId(id);
    setSection('authors');
  };

  const handleSectionChange = (next) => {
    setSection(next);
    if (next !== 'authors') setAuthorId(null);
    if (next !== 'music') setMusicEditTrack(null);
  };

  const renderSection = () => {
    if (section === 'authors') {
      if (authorId) {
        if (musicEditTrack) {
          return (
            <WebAdminTrackEdit
              track={musicEditTrack}
              onBack={() => setMusicEditTrack(null)}
              onSaved={() => {
                setMusicEditTrack(null);
                setAuthorRefresh((value) => value + 1);
              }}
              onOpenAuthor={openAuthor}
            />
          );
        }
        return (
          <WebAdminAuthorPage
            authorId={authorId}
            refreshToken={authorRefresh}
            onBack={() => setAuthorId(null)}
            onEditTrack={(track) => setMusicEditTrack(track)}
          />
        );
      }
      return <WebAdminAuthors onOpenAuthor={setAuthorId} />;
    }

    switch (section) {
      case 'analytics':
        return <WebAdminAnalytics />;
      case 'categories':
        return <WebAdminCategories />;
      case 'music':
        return (
          <WebAdminMusic
            onOpenAuthor={openAuthor}
          />
        );
      default:
        return <WebAdminDashboard />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <WebAdminLayout
        activeSection={section}
        onSectionChange={handleSectionChange}
        userEmail={user?.email}
        onLogout={logout}
      >
        {renderSection()}
      </WebAdminLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100vh',
  },
});
