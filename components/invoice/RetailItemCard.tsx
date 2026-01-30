import { View, Text, Pressable, TextInput, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect } from "react";
import { useTheme } from "@/components/context/theme-context";

interface RetailItemCardProps {
  item: {
    product_id: number;
    product_name: string;
    manufacturer?: string | null;
    price: number;
    quantity: number;
    discount?: number;
  };

  expanded: boolean;
  maxQty: number;
  remainingStock: number;

  onToggle: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onChangeQty: (qty: number) => void;
  onRemove: () => void;
}

export default function RetailItemCard({
  item,
  expanded,
  maxQty,
  remainingStock,
  onToggle,
  onIncrease,
  onDecrease,
  onChangeQty,
  onRemove,
}: RetailItemCardProps) {
  const totalBefore = item.price * item.quantity;
  const totalDiscount = (item.discount || 0) * item.quantity;
  const totalAfter = totalBefore - totalDiscount;
  const { isDark, colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.castm,
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: expanded ? 1 : 0,
        borderColor: expanded ? colors.primary : colors.border,
      }}
    >
      {/* ===== HEADER ===== */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={onToggle} hitSlop={10}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94a3b8"
            style={{ marginLeft: 10 }}
          />
        </Pressable>

        {/* الكمية */}
        <TextInput
          value={String(item.quantity)}
          keyboardType="numeric"
          onChangeText={(v) => {
            const n = Number(v);
            if (!isNaN(n) && n > 0) onChangeQty(n);
          }}
          style={{
            backgroundColor: colors.input,
            color: colors.text,
            borderRadius: 6,
            paddingHorizontal: 10,
            marginHorizontal: 10,
            textAlign: "center",
            minWidth: 50,
            borderColor: colors.border,
          }}
        />

        {/* السعر */}
        <Text style={{ color: "#22c55e", fontWeight: "600", marginLeft: 6 }}>
          {item.price}
        </Text>

        {/* الاسم */}
        <Pressable onPress={onToggle} style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              textAlign: "right",
              fontWeight: "600",
            }}
          >
            {item.product_name}{" "}
            <Text style={{ color: "#ce788bff" }}>- {item.manufacturer}</Text>
          </Text>
        </Pressable>
      </View>

      {/* ===== DETAILS ===== */}
      {expanded && (
        <>
          <Text
            style={{ color: colors.muted, fontSize: 12, textAlign: "right" }}
          >
            الرصيد المتاح: {remainingStock}
          </Text>

          <Text style={{ color: "#9ca3af", fontSize: 13, textAlign: "right" }}>
            إجمالي قبل الخصم: {totalBefore}
          </Text>

          {item.discount ? (
            <Text
              style={{ color: colors.egmaly, fontSize: 13, textAlign: "right" }}
            >
              إجمالي الخصم: {totalDiscount}
            </Text>
          ) : null}

          <Text
            style={{
              color: "#22c55e",
              fontWeight: "700",
              textAlign: "right",
            }}
          >
            الإجمالي بعد الخصم: {totalAfter}
          </Text>

          <Pressable
            onPress={onRemove}
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={{ color: "#ef4444", marginLeft: 4 }}>مسح الصنف</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
