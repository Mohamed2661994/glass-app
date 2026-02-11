import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from "react-native";

type Props = {
  value: string;
  onChange: (val: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;

  /** 👇 جديد */
  countRef?: React.RefObject<TextInput | null>;

  onNext?: () => void;
};

const OPTIONS = ["دستة", "طقم", "قطعة"];

export default function WholesalePackageInput({
  value,
  onChange,
  open,
  onOpen,
  onClose,
  countRef,
  onNext,
}: Props) {
  const { colors } = useTheme();

  const [count, setCount] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const comboRef = useRef<View>(null);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  /* ===== تحديث القيمة ===== */
  const updateValue = (c: string, u: string | null) => {
    if (!c || !u) {
      onChange("");
      return;
    }
    onChange(`كرتونة ${c} ${u}`);
  };

  /* ===== تصفير داخلي ===== */
  useEffect(() => {
    if (!value) {
      setCount("");
      setUnit(null);
      onClose();
    }
  }, [value]);

  /* ===== قياس مكان الكمبوبوكس ===== */
  const measurePosition = () => {
    comboRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPos({
        left: x,
        top: y + height,
        width,
      });
    });
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(measurePosition);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      if (open) requestAnimationFrame(measurePosition);
    });
    return () => sub?.remove();
  }, [open]);

  /* ===== Keyboard (Web) ===== */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "NumpadEnter") {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "ArrowDown") {
        setActiveIndex((i) => Math.min(i + 1, OPTIONS.length - 1));
      }

      if (e.key === "ArrowUp") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }

      if (e.key === "Enter" && OPTIONS[activeIndex]) {
        setUnit(OPTIONS[activeIndex]);
        updateValue(count, OPTIONS[activeIndex]);
        onClose();

        // 👇 انتقل للي بعده في الفورم
        requestAnimationFrame(() => {
          onNext?.();
        });
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, activeIndex, count, onNext]);

  return (
    <>
      {/* ===== الحقول ===== */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        {/* ===== Combobox ===== */}
        <View ref={comboRef} style={{ flex: 1 }}>
          <Pressable
            onPress={onOpen}
            focusable={false}
            accessible={false}
            style={{
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

        {/* ===== العدد ===== */}
        <TextInput
          ref={countRef}
          placeholder="عدد"
          keyboardType="numeric"
          value={count}
          onChangeText={(text) => {
            setCount(text);
            updateValue(text, unit);
          }}
          returnKeyType="next"
          onSubmitEditing={() => {
            onOpen();
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
        <Modal transparent animationType="fade" onRequestClose={onClose}>
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <View
              style={{
                position: "absolute",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
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
                renderItem={({ item, index }) => {
                  const active = index === activeIndex;

                  return (
                    <Pressable
                      onPress={() => {
                        setUnit(item);
                        updateValue(count, item);
                        onClose();
                        onNext?.();
                      }}
                      style={{
                        padding: 12,
                        backgroundColor: active
                          ? colors.primary + "22"
                          : "transparent",
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: active ? colors.primary : colors.text,
                        }}
                      >
                        {item}
                      </ThemedText>
                    </Pressable>
                  );
                }}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
