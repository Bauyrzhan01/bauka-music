import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  maxLength,
  keyboardType,
  hint,
  icon,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        {icon ? (
          <Ionicons name={icon} size={16} color="#666" />
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      ) : (
        <View style={styles.readonly}>
          <Text style={styles.readonlyText} selectable>
            {value || '—'}
          </Text>
          <Ionicons name="lock-closed-outline" size={14} color="#bbb" />
        </View>
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
  },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  readonlyText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
});
