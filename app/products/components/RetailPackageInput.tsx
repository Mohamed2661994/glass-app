import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (val: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const OPTIONS = ["شيالة", "علبة", "طقم", "قطعة"];

export default function RetailPackageInput({
  value,
  onChange,
  open,
  onOpen,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const [count, setCount] = useState("");
  const [unit, setUnit] = useState<string | null>(null);

  const updateValue = (c: string, u: string | null) => {
    if (!c || !u) {
      onChange("");
      return;
    }
    onChange(`${c} ${u}`);
  };

  useEffect(() => {
    if (!value) {
      setCount("");
      setUnit(null);
      onClose();
    }
  }, [value]);

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* العدد */}
        <TextInput
          placeholder="عدد"
          keyboardType="numeric"
          value={count}
          onChangeText={(t) => {
            setCount(t);
            updateValue(t, unit);
          }}
          style={{
            flex: 1,
            height: 48,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
            textAlign: "center",
          }}
        />

        {/* combobox */}
        <Pressable
          onPress={onOpen}
          style={{
            flex: 1,
            height: 48,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            backgroundColor: colors.input,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ThemedText style={{ color: unit ? colors.text : "#9ca3af" }}>
            {unit ?? "اختر"}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color="#9ca3af" />
        </Pressable>
      </View>

      {/* ===== Modal Dropdown ===== */}
      {open && (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <View
              style={{
                position: "absolute",
                top: 430, // 👈 ظبطه حسب مكانك
                left: 230,
                right: 670,
                backgroundColor: colors.card,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setUnit(opt);
                    updateValue(count, opt);
                    onClose();
                  }}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <ThemedText style={{ color: colors.text }}>{opt}</ThemedText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
