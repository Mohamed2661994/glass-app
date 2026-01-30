import { AuthProvider, useAuth } from "@/components/context/AuthContext";
import {
  NotificationProvider,
  useNotifications,
} from "@/components/context/NotificationContext";
import { ThemeProvider, useTheme } from "@/components/context/theme-context";
import GlobalNotification, {
  triggerNotification,
} from "@/components/GlobalNotification";
import { socket } from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <RootLayoutContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { token, loading, user } = useAuth();
  const { addNotification } = useNotifications();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });
  const segments = useSegments();

  // 🎯 حماية التنقل
  useEffect(() => {
    if (loading) return; // استنى ما الجلسة تتحمل

    const inAuthScreen = segments[0] === "login";

    if (!token && !inAuthScreen) {
      router.replace("/login");
    }

    if (token && inAuthScreen) {
      router.replace("/" as never);
    }
  }, [token, segments, loading]);
  // 🔔 تسجيل المستخدم في غرفة الفرع + استقبال الإشعارات
  useEffect(() => {
    if (!user?.id || !user?.branch_id) return;

    if (!socket.connected) socket.connect();

    socket.emit("register_user", {
      user_id: user.id,
      branch_id: user.branch_id,
    });

    const handleNotification = (data: any) => {
      triggerNotification(data.title, data.message);
      addNotification(data);
    };

    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, [user]); // 👈 مهم جدًا

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden"); // يخفي الشريط
      NavigationBar.setBehaviorAsync("overlay-swipe");
      NavigationBar.setBackgroundColorAsync("#00000000");
      NavigationBar.setButtonStyleAsync("light"); // الأيقونات تبقى فاتحة
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.innerHTML = `
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb {
          background-color: #2a2a2a;
          border-radius: 8px;
          border: 2px solid #0f172a;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* شاشة تسجيل الدخول */}
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* التطبيق بعد تسجيل الدخول */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="replace" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <GlobalNotification />
      <StatusBar translucent backgroundColor="transparent" style="light" />
    </NavigationThemeProvider>
  );
}
