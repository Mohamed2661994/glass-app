import { useTheme } from "@/components/context/theme-context";
import { fontSize, radius, spacing } from "@/constants/tokens";
import { TextInput, TextInputProps } from "react-native";

type Props = TextInputProps;

export default function Input(props: Props) {
  const { colors } = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.muted}
      style={[
        {
          backgroundColor: colors.input,
          color: colors.text,
          padding: spacing.md,
          borderRadius: radius.md,
          fontSize: fontSize.md,

          // ✅ المهم
          borderWidth: 1,
          borderColor: colors.border,
        },
        props.style,
      ]}
    />
  );
}
