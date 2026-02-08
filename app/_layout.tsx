import { AuthProvider, useAuth } from "@/components/context/AuthContext";
import {
  CashCountProvider,
  useCashCount,
} from "@/components/context/CashCountContext";
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
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

import CashCountGlobalModal from "@/components/CashCountGlobalModal";
import { Audio } from "expo-av";
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
            <CashCountProvider>
              <RootLayoutContent />
            </CashCountProvider>
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

  function GlobalKeyboardShortcuts() {
    const { setOpen } = useCashCount();

    useEffect(() => {
      if (Platform.OS !== "web") return;

      const handleKey = (e: KeyboardEvent) => {
        // تجاهل لو المستخدم بيكتب داخل input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (e.key === "F7") {
          e.preventDefault();
          setOpen(true);
        }

        if (e.key === "Escape") {
          setOpen(false);
        }
      };

      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, []);

    return null;
  }

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
      //branch_id: user.branch_id,
    });
    async function playNotificationSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/notification.wav"),
        );
        await sound.playAsync();
      } catch (e) {
        console.log("Sound error", e);
      }
    }
    const handleNotification = (data: any) => {
      const formatted = {
        title: data.title,
        message: data.message,
        invoice_id: data.invoice_id || data.reference_id, // ✅ الإصلاح
        type: data.type,
      };

      triggerNotification(formatted.title, formatted.message);
      console.log("NOTIFICATION RECEIVED:", data);
      console.log("NOTIF DATA:", data);
      addNotification(formatted);

      playNotificationSound();
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
  const AppContent = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <GlobalKeyboardShortcuts />
      <CashCountGlobalModal />

      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="replace" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <GlobalNotification />
      <StatusBar translucent backgroundColor="transparent" style="light" />
    </KeyboardAvoidingView>
  );
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {Platform.OS === "web" ? (
        <View style={{ flex: 1 }}>{AppContent}</View>
      ) : (
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          {AppContent}
        </Pressable>
      )}
    </NavigationThemeProvider>
  );
}
