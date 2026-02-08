import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuth from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function AppLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    setBiometricAvailable(hasHardware && enrolled);

    const storedPin = await AsyncStorage.getItem("APP_PIN");
    setSavedPin(storedPin);
  };

  const handleBiometric = async () => {
    const res = await LocalAuth.authenticateAsync({
      promptMessage: "افتح التطبيق",
    });
    if (res.success) onUnlock();
  };

  const handlePinSubmit = async () => {
    if (pin === savedPin) onUnlock();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 التطبيق مقفول</Text>

      {biometricAvailable && (
        <Pressable style={styles.bioBtn} onPress={handleBiometric}>
          <Text style={{ color: "#fff" }}>استخدام البصمة</Text>
        </Pressable>
      )}

      {savedPin && (
        <>
          <Text style={styles.pinLabel}>أدخل PIN</Text>
          <TextInput
            secureTextEntry
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
            style={styles.input}
          />
          <Pressable style={styles.unlockBtn} onPress={handlePinSubmit}>
            <Text style={{ color: "#fff" }}>فتح</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 30 },
  bioBtn: {
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  pinLabel: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    width: "60%",
    padding: 10,
    textAlign: "center",
    marginBottom: 10,
  },
  unlockBtn: { backgroundColor: "#16a34a", padding: 12, borderRadius: 10 },
});
