import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

type Option = {
  label: string;
  value: string | null;
};

type NativeSelectProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  colors: any;
};

export default function NativeSelect({
  value,
  onChange,
  options,
  placeholder = "اختر",
  colors,
}: NativeSelectProps) {
  const isIOS = Platform.OS === "ios";
  const [open, setOpen] = useState(false);

  if (isIOS) {
    return (
      <>
        <Pressable
          onPress={() => setOpen(true)}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            height: 48,
            paddingHorizontal: 12,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.text }}>
            {value ??
              options.find((o) => o.value === value)?.label ??
              placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </Pressable>

        {open && (
          <View
            style={{
              position: "absolute",
              top: 60,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              zIndex: 999,
            }}
          >
            {options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: i === options.length - 1 ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </>
    );
  }

  // Android + Web
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: colors.card,
      }}
    >
      <Picker
        selectedValue={value}
        onValueChange={(v) => onChange(v)}
        dropdownIconColor={colors.text}
        style={{
          color: colors.text,
          height: 48,
        }}
      >
        {options.map((opt, i) => (
          <Picker.Item key={i} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}
