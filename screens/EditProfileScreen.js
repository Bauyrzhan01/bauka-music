import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOsBack } from '../hooks/useOsBack';
import ProfileEditorForm from '../components/profile/ProfileEditorForm';

export default function EditProfileScreen({ onBack }) {
  useOsBack(onBack);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.title}>Редактирование профиля</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Имя и аватар отображаются на главной, в плеере и в Reels.
        </Text>
        <ProfileEditorForm />
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 4,
  },
});
