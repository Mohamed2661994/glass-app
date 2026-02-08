import { useTheme } from "@/components/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle:
          Platform.OS === "web"
            ? { display: "none" } // 👈 يخفيه في الويب
            : {
                height: Platform.OS === "android" ? 70 : 85,
                paddingBottom: Platform.OS === "android" ? 10 : 8,
                paddingTop: 6,
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderTopColor: "rgba(59, 130, 246, 0.25)",
                borderTopWidth: 1,
              },

        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
        },

        tabBarItemStyle: {
          paddingVertical: 4,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },

        tabBarActiveTintColor: isDark ? "#ffffff" : "#d7dae6",
        tabBarInactiveTintColor: isDark ? "#94a3b8" : "#7d8596",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          title: "الفواتير",
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "إضافة صنف",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
