import api from "@/services/api";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

type ThemeColors = {
  background: string;
  text: string;
  card: string;
  border: string;
  input: string;
  muted: string;

  primary: string;

  // ✅ ألوان قياسية جديدة
  success: string;
  danger: string;

  // 🧓 ألوان قديمة (سيبها)
  castm: string;
  egmaly: string;
  botme: string;
  botmd: string;
  botmf: string;
  botmbar: string;
  botmta: string;
  divider: string;
};

const THEMES: Record<"light" | "dark", ThemeColors> = {
  dark: {
    background: "#020617",
    text: "#e5e7eb",
    card: "#020617",
    border: "#1e293b",
    input: "#020617",
    muted: "#94a3b8",

    primary: "#2563eb",

    // 👇 الجديد
    success: "rgb(230, 226, 28)", // أو اللي يعجبك
    danger: "rgb(189, 88, 88)",

    // 👇 القديم (زي ما هو)
    castm: "#071941ff",
    egmaly: "#FACC15",
    botme: "#0e2e97ff",
    botmd: "#911e1eff",
    botmf: "rgb(23, 52, 131)",
    botmbar: "#1f2a44",
    botmta: "rgb(183, 211, 108)",
    divider: "#0822B6",
  },

  light: {
    background: "#f8fafc",
    text: "#020617",
    card: "#ffffff",
    border: "#c3c4c5ff",
    input: "#ffffff",
    muted: "#64748b",

    primary: "#2563eb",

    // 👇 الجديد
    success: "#22c55e",
    danger: "rgba(197, 7, 7, 0.93)",

    // 👇 القديم
    castm: "#d4d5d8ff",
    egmaly: "#114ceeff",
    botme: "rgb(11, 56, 204)",
    botmd: "rgba(197, 7, 7, 0.93)",
    botmf: "rgb(144, 166, 228)",
    botmbar: "#e4e8f0",
    botmta: "rgb(48, 82, 231)",
    divider: "#171717",
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // light | dark
  const getInitialMode = (): ThemeMode => {
    if (Platform.OS === "web") {
      const saved = localStorage.getItem("app-theme") as ThemeMode | null;
      return saved || "system";
    }
    return "system";
  };
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (Platform.OS === "web") {
      return (localStorage.getItem("app-theme") as ThemeMode) || "system";
    }
    return "system";
  });

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  const colors = isDark ? THEMES.dark : THEMES.light;

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);

    if (Platform.OS === "web") {
      localStorage.setItem("app-theme", newMode);
    }
  };

  useEffect(() => {
    const loadThemeFromServer = async () => {
      try {
        const res = await api.get("/users/me"); // أو endpoint بيانات المستخدم
        const savedTheme = res.data?.theme as ThemeMode | undefined;

        if (savedTheme && savedTheme !== mode) {
          setModeState(savedTheme);

          if (Platform.OS === "web") {
            localStorage.setItem("app-theme", savedTheme);
          }
        }
      } catch (e) {
        console.log("Failed to load theme from server");
      }
    };

    loadThemeFromServer();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const root = document.documentElement;
      root.classList.remove("light", "dark");

      const active =
        mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

      root.classList.add(active);
    }
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
