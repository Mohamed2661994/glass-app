import { TouchableOpacity, View } from "react-native";

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
};

export default function WebSwitch({ value, onChange, colors }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? colors.primary : colors.border,
        padding: 2,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: value ? "#fff" : "#e5e7eb",
          transform: [{ translateX: value ? 20 : 0 }],
        }}
      />
    </TouchableOpacity>
  );
}
