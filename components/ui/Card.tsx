import { useTheme } from "@/components/context/theme-context";
import { radius, spacing } from "@/constants/tokens";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function Card({ children, style, onPress }: Props) {
  const { colors } = useTheme();

  const baseStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    style,
  ];

  // 👇 لو Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.border }}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.9 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  // 👇 لو View عادي
  return <View style={baseStyle}>{children}</View>;
}
