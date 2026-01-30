import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

interface User {
  id: number;
  username: string;
  branch_id: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean; // 👈 معناها: هل لسه بتحميل الجلسة
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/* 🔐 تخزين حسب المنصة */
const storage = {
  async set(key: string, value: string) {
    if (Platform.OS === "web") localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async get(key: string) {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  async remove(key: string) {
    if (Platform.OS === "web") localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // 👈 ده المهم

  // 🔄 تحميل الجلسة عند تشغيل التطبيق
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await storage.get("token");
        const savedUser = await storage.get("user");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.log("Session load error", e);
      } finally {
        setLoading(false); // 👈 خلصنا تحميل
      }
    };

    loadSession();
  }, []);

  const login = async (token: string, user: User) => {
    setUser(user);
    setToken(token);
    await storage.set("token", token);
    await storage.set("user", JSON.stringify(user));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.remove("token");
    await storage.remove("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
