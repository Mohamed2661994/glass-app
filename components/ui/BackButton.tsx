import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/components/context/theme-context";

export default function BackButton() {
  const { colors } = useTheme();

  return (
    <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
      <Ionicons name="chevron-back" size={28} color={colors.primary} />
    </Pressable>
  );
}
