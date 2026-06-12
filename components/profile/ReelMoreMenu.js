import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_MENU_BTN = {
  position: 'absolute',
  top: 6,
  right: 6,
  zIndex: 5,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: 'rgba(0,0,0,0.55)',
};

export default function ReelMoreMenu({
  onDelete,
  isDeleting = false,
  buttonStyle,
  iconSize = 16,
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => {
    if (isDeleting) return;
    setMenuVisible(true);
  };

  const closeMenu = () => setMenuVisible(false);

  const handleDeletePress = () => {
    closeMenu();
    onDelete?.();
  };

  return (
    <>
      <Pressable
        style={[styles.menuBtn, buttonStyle ?? CARD_MENU_BTN]}
        onPress={openMenu}
        disabled={isDeleting}
        accessibilityLabel="Действия"
        hitSlop={6}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="ellipsis-vertical" size={iconSize} color="#fff" />
        )}
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.sheetTitle}>Действия</Text>
            <Pressable style={styles.deleteRow} onPress={handleDeletePress}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <Text style={styles.deleteText}>Удалить видео</Text>
            </Pressable>
            <Pressable style={styles.cancelRow} onPress={closeMenu}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  sheet: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a9a9a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  cancelRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#9a9a9a',
    fontWeight: '500',
  },
});
