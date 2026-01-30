import { Tabs } from "expo-router";
import React from "react";

import { useTheme } from "@/components/context/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          paddingVertical: 6,
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderTopColor: "rgba(59, 130, 246, 0.3)",
          position: "absolute",
        },
        tabBarLabelPosition: "below-icon",

        tabBarActiveTintColor: isDark ? "#ffffff" : "#d7dae6",
        tabBarInactiveTintColor: isDark ? "#94a3b8" : "#7d8596",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          title: "الفواتير",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "إضافة صنف",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
