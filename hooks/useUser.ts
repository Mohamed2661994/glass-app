import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export interface User {
  id: number;
  username: string;
  branch_id: number;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let data: string | null = null;

        if (Platform.OS === "web") {
          // ✅ في الويب نستخدم localStorage
          data = localStorage.getItem("user");
        } else {
          // ✅ في الموبايل نستخدم SecureStore
          data = await SecureStore.getItemAsync("user");
        }

        if (data) setUser(JSON.parse(data));
      } catch (e) {
        console.log("Load user error", e);
      }
    };

    loadUser();
  }, []);

  return { user };
};
