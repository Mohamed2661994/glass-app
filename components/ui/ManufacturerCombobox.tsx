import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
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
  inputRef?: React.RefObject<TextInput>;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;

  /** 👇 جديد */
  onNext?: () => void;
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
  onNext, // 👈 جديد
}: Props) {
  const { colors } = useTheme();

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const inputContainerRef = useRef<View>(null);
  const listRef = useRef<FlatList<string>>(null);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  /* ===================== fetch ===================== */
  useEffect(() => {
    api
      .get<ProductRow[]>("/admin/products")
      .then((res) => {
        const list = Array.from(
          new Set(
            res.data
              .map((p) => p.manufacturer)
              .filter((m): m is string => !!m?.trim()),
          ),
        ).sort((a, b) => a.localeCompare(b, "ar"));

        setManufacturers(list);
      })
      .catch(console.log);
  }, []);

  /* ===================== filter ===================== */
  const filtered = useMemo(() => {
    if (!value) return manufacturers;
    return manufacturers.filter((m) =>
      m.toLowerCase().includes(value.toLowerCase()),
    );
  }, [value, manufacturers]);

  /* ===================== measure ===================== */
  const measurePosition = () => {
    inputContainerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPos({
        left: x,
        top: y + height,
        width,
      });
    });
  };

  /* لما القائمة تفتح */
  useEffect(() => {
    if (open) {
      requestAnimationFrame(measurePosition);
      if (filtered.length > 0) setActiveIndex(0);
    }
  }, [open, filtered]);

  /* لما البراوزر يتغير حجمه */
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      if (open) {
        requestAnimationFrame(measurePosition);
      }
    });

    return () => sub?.remove();
  }, [open]);

  /* ===================== keyboard ===================== */
  const handleKeyPress = (key: string) => {
    if (!open || filtered.length === 0) return;

    if (key === "ArrowDown") {
      setActiveIndex((prev) => {
        const next = Math.min(prev + 1, filtered.length - 1);
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }

    if (key === "ArrowUp") {
      setActiveIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }

    if (key === "Enter" && activeIndex >= 0) {
      onChange(filtered[activeIndex]);
      onClose();

      // 👇 لو في خطوة بعدها (تنقّل بالـ Enter)
      requestAnimationFrame(() => {
        if (onNext) {
          onNext();
        } else {
          inputRef?.current?.focus();
        }
      });
    }

    if (key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // 👈 امنع Enter يتحول لـ click
      if (e.key === "Enter" || e.key === "NumpadEnter") {
        e.preventDefault();
        e.stopPropagation();
      }

      handleKeyPress(e.key);
    };

    // 👈 capture phase
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, activeIndex, filtered, onNext]);

  return (
    <>
      {/* ===== Input ===== */}
      <View ref={inputContainerRef}>
        <TextInput
          ref={inputRef}
          placeholder="المصنع"
          value={value}
          onChangeText={(text) => {
            onChange(text);
            onOpen();
          }}
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

        {/* ===== Arrow ===== */}
        <Pressable
          onPress={onOpen}
          focusable={false}
          accessible={false}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: [{ translateY: -10 }],
          }}
        >
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color="#9ca3af"
          />
        </Pressable>
      </View>

      {/* ===== Dropdown Modal ===== */}
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
                maxHeight: 250,
              }}
            >
              <FlatList
                ref={listRef}
                data={filtered}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                  const active = index === activeIndex;

                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item);
                        onClose();
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
