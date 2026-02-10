import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (val: string) => void;
  inputRef?: React.RefObject<TextInput>;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type ProductRow = {
  manufacturer: string | null;
};

export default function ManufacturerCombobox({
  value,
  onChange,
  inputRef,
  open,
  onOpen,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        setLoading(true);
        const res = await api.get<ProductRow[]>("/admin/products");

        const list = Array.from(
          new Set(
            res.data
              .map((p) => p.manufacturer)
              .filter((m): m is string => !!m?.trim()),
          ),
        ).sort((a, b) => a.localeCompare(b, "ar"));

        setManufacturers(list);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturers();
  }, []);

  const filtered = useMemo(() => {
    if (!value) return manufacturers;
    return manufacturers.filter((m) =>
      m.toLowerCase().includes(value.toLowerCase()),
    );
  }, [value, manufacturers]);

  return (
    <View style={{ position: "relative" }}>
      {/* ===== Input ===== */}
      <TextInput
        ref={inputRef}
        placeholder="المصنع"
        value={value}
        onChangeText={(text) => {
          onChange(text);
          onOpen();
        }}
        returnKeyType="next"
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingRight: 40,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      {/* ===== زر السهم فقط ===== */}
      <Pressable
        onPress={onOpen}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: [{ translateY: -10 }],
          padding: 6,
        }}
      >
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9ca3af"
        />
      </Pressable>

      {/* ===== Dropdown ===== */}
      {open && (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose} // 👈 ضغط برّه
          >
            <View
              style={{
                position: "absolute",
                top: 310, // 👈 هنظبطها كمان شوية
                left: 30,
                right: 660,
                backgroundColor: colors.card,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                maxHeight: 250,
              }}
            >
              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onChange(item);
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
    </View>
  );
}
