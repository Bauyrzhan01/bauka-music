import { Alert, Platform } from 'react-native';

export function confirmAction({
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Отмена',
  destructive = false,
}) {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const text = message ? `${title}\n\n${message}` : title;
      resolve(window.confirm(text));
      return;
    }

    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
