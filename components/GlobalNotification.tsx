import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

let showGlobalNotification: (title: string, message: string) => void;

export function triggerNotification(title: string, message: string) {
  showGlobalNotification?.(title, message);
}

export default function GlobalNotification() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    showGlobalNotification = (t, m) => {
      setTitle(t);
      setMessage(m);
      setVisible(true);
      playSound();

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 4000);
    };

    loadSound();
  }, []);

  const loadSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/notification.wav"), // نفس صوت الباركود عندك
    );
    soundRef.current = sound;
  };

  const playSound = async () => {
    try {
      await soundRef.current?.replayAsync();
    } catch {}
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    zIndex: 9999,
    elevation: 20,
  },
  title: {
    color: "#22c55e",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    color: "#e2e8f0",
    fontSize: 13,
  },
});
