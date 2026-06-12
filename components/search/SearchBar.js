import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileTheme } from '../../constants/mobileTheme';

export default function SearchBar({ value, onChangeText, onClear }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={20} color={mobileTheme.iconMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Поиск песен и исполнителей"
        placeholderTextColor={mobileTheme.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={onClear} accessibilityLabel="Очистить">
          <Ionicons name="close-circle" size={20} color={mobileTheme.iconMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: mobileTheme.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: mobileTheme.text,
    padding: 0,
  },
});
