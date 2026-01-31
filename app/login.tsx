import { useAuth } from "@/components/context/AuthContext";
import api from "@/services/api";
import { socket } from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image } from "react-native";

import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [passFocused, setPassFocused] = useState(false);
  const [userFocused, setUserFocused] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("تنبيه", "ادخل اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/login", { username, password });
      const { token, user } = res.data;

      await login(token, user);

      // 🔌 تشغيل السوكيت
      socket.connect();

      socket.emit("register_user", {
        user_id: user.id,
        //branch_id: user.branch_id,
      });

      router.replace("/");

      setTimeout(() => {
        Alert.alert("تم", "تم تسجيل الدخول بنجاح ✅");
      }, 300);
    } catch (err: any) {
      if (!err.response) {
        Alert.alert("مشكلة اتصال", "التطبيق مش قادر يوصل للسيرفر");
      } else {
        Alert.alert("خطأ", err.response.data?.error || "فشل تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  const [showPassword, setShowPassword] = useState(false);

  const ScreenWrapper: React.ComponentType<any> =
    Platform.OS === "web" ? View : TouchableWithoutFeedback;

  const wrapperProps =
    Platform.OS === "web"
      ? { style: { flex: 1 } } // 👈 ضيف دي
      : { onPress: Keyboard.dismiss, accessible: false };

  return (
    <ScreenWrapper {...wrapperProps}>
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            },
          ]}
        >
          {/* اللوجو */}
          <Image
            source={require("@/assets/images/logo-light.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>تسجيل الدخول</Text>

          <TextInput
            placeholder="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            style={[
              styles.input,
              userFocused && { borderColor: "#2563eb" },
              Platform.OS === "web" ? ({ outlineWidth: 0 } as any) : null,
            ]}
            placeholderTextColor="#94a3b8"
            returnKeyType="next"
            onFocus={() => setUserFocused(true)}
            onBlur={() => setUserFocused(false)}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* حقل الباسورد مع أيقونة */}
          <View
            style={[
              styles.passwordWrapper,
              passFocused && { borderColor: "#2563eb" },
            ]}
          >
            <TextInput
              ref={passwordRef}
              placeholder="كلمة المرور"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={[
                styles.passwordInput,
                Platform.OS === "web" ? ({ outlineWidth: 0 } as any) : null,
              ]}
              placeholderTextColor="#94a3b8"
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "جاري الدخول..." : "دخول"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 420 : "100%",
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#0f172a",
    color: "#fff",
    textAlign: "right",
    fontSize: 15,
  },

  passwordWrapper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0f172a",
    marginBottom: 16,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: "#fff",
    textAlign: "right",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    ...(Platform.OS === "web" ? { cursor: "pointer" as any } : {}),
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
