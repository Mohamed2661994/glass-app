import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';

export function AppToast({
  message,
  type = 'success',
  onHide,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onHide, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.toast, styles[type]]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  success: { backgroundColor: '#27ae60' },
  error: { backgroundColor: '#c0392b' },
  info: { backgroundColor: '#2980b9' },
});
