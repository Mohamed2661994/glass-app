import { useTheme } from "@/components/context/theme-context";
import { fontSize, radius, spacing } from "@/constants/tokens";
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "success" | "danger" | "ghost";

  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
}: Props) {
  const { colors } = useTheme();

  const bg =
    variant === "danger"
      ? colors.danger
      : variant === "success"
        ? colors.success
        : variant === "ghost"
          ? "transparent"
          : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        opacity: disabled ? 0.6 : 1,
        width: "100%", // ✅ المهم
        alignItems: "center", // ✅ توسيط النص
      }}
    >
      <Text
        style={{
          color: variant === "ghost" ? colors.text : "#fff",
          textAlign: "center",
          fontWeight: "700",
          fontSize: fontSize.md,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
