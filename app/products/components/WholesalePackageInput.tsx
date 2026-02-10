import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (val: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const OPTIONS = ["دستة", "طقم", "قطعة"];

export default function WholesalePackageInput({
  value,
  onChange,
  open,
  onOpen,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const [count, setCount] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  //const [open, setOpen] = useState(false);

  // 🔹 تحديث القيمة النهائية
  const updateValue = (c: string, u: string | null) => {
    if (!c || !u) {
      onChange("");
      return;
    }
    onChange(`كرتونة ${c} ${u}`);
  };

  // 🔹 تصفير داخلي
  useEffect(() => {
    if (!value) {
      setCount("");
      setUnit(null);
      onClose();
    }
  }, [value]);

  return (
    <>
      {/* ===== الحقول ===== */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        {/* ===== Combobox ===== */}
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

        {/* ===== العدد ===== */}
        <TextInput
          placeholder="عدد"
          keyboardType="numeric"
          value={count}
          onChangeText={(text) => {
            setCount(text);
            updateValue(text, unit);
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

        {/* ===== كرتونة ثابت ===== */}
        <View
          style={{
            height: 48,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
          }}
        >
          <ThemedText style={{ fontWeight: "600", color: colors.text }}>
            كرتونة
          </ThemedText>
        </View>
      </View>

      {/* ===== Dropdown (Modal) ===== */}
      {open && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <View
              style={{
                position: "absolute",
                top: 370, // 👈 عدّلها حسب مكان الفورم
                left: 35,
                right: 940,
                backgroundColor: colors.card,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                maxHeight: 220,
              }}
            >
              <FlatList
                data={OPTIONS}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setUnit(item);
                      updateValue(count, item);
                      onClose();
                    }}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <ThemedText style={{ color: colors.text }}>
                      {item}
                    </ThemedText>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
