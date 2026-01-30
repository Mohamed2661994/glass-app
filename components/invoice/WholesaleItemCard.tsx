import { View, Text, Pressable, TextInput, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect } from "react";

type Props = {
  item: {
    product_id: number;
    product_name: string;
    manufacturer?: string;
    price: number;
    quantity: number;
    discount: number;
  };

  movementType: "sale" | "purchase";

  expanded: boolean;

  maxQty: number;
  remainingStock: number;

  onToggle: () => void;

  onIncrease: () => void;
  onDecrease: () => void;

  onChangeQty: (q: number) => void;
  onChangeDiscount: (d: number) => void;

  onRemove: () => void;
};

export default function WholesaleItemCard({
  item,
  movementType,
  expanded,
  maxQty,
  remainingStock,
  onToggle,
  onIncrease,
  onDecrease,
  onChangeQty,
  onChangeDiscount,
  onRemove,
}: Props) {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View
      style={{
        backgroundColor: "#0f172a",
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: expanded ? 1 : 0,
        borderColor: "#2563eb",
      }}
    >
      {/* ===== HEADER ===== */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={onToggle}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94a3b8"
            style={{ marginLeft: 10 }}
          />
        </Pressable>

        {/* ===== Quantity ===== */}
        <View style={{ paddingLeft: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={onDecrease}>
              <Text style={{ color: "#fff", fontSize: 18 }}>−</Text>
            </Pressable>

            <TextInput
              value={String(item.quantity)}
              keyboardType="numeric"
              onChangeText={(v) => {
                const n = Number(v);
                if (!n || n < 1) return;
                if (movementType === "sale" && n > maxQty) return;
                onChangeQty(n);
              }}
              style={{
                color: "#fff",
                marginHorizontal: 10,
                minWidth: 40,
                textAlign: "center",
                backgroundColor: "#000",
                borderRadius: 6,
              }}
            />

            <Pressable onPress={onIncrease}>
              <Text style={{ color: "#fff", fontSize: 18 }}>+</Text>
            </Pressable>
          </View>

          {/* خصم تحت الكمية لما الكارت مقفول */}
          {!expanded && (
            <TextInput
              value={String(item.discount || "")}
              keyboardType="numeric"
              placeholder="خصم"
              placeholderTextColor="#6b7280"
              onChangeText={(v) => {
                const n = Number(v);
                if (n >= 0) onChangeDiscount(n);
              }}
              style={{
                backgroundColor: "#000",
                color: "#fff",
                marginTop: 6,
                borderRadius: 6,
                textAlign: "center",
                fontSize: 12,
              }}
            />
          )}
        </View>

        {/* السعر */}
        <Text style={{ color: "#22c55e", marginLeft: 10 }}>
          {item.price - item.discount}
        </Text>

        {/* الاسم */}
        <Pressable onPress={onToggle} style={{ flex: 1 }}>
          <Text style={{ color: "#fff", textAlign: "right" }}>
            {item.product_name}
            {item.manufacturer && (
              <Text style={{ color: "#ce788bff" }}> - {item.manufacturer}</Text>
            )}
          </Text>
        </Pressable>
      </View>

      {/* ===== DETAILS ===== */}
      {expanded && (
        <Animated.View style={{ marginTop: 12 }}>
          {movementType === "sale" && (
            <Text style={{ color: "#9ca3af" }}>
              الرصيد المتاح: {remainingStock}
            </Text>
          )}

          <TextInput
            value={String(item.discount || "")}
            keyboardType="numeric"
            onChangeText={(v) => {
              const n = Number(v);
              if (n >= 0) onChangeDiscount(n);
            }}
            style={{
              backgroundColor: "#111",
              color: "#fff",
              borderRadius: 6,
              width: 70,
              alignSelf: "flex-end",
              textAlign: "center",
              marginVertical: 6,
            }}
          />

          <Text style={{ color: "#22c55e", textAlign: "right" }}>
            الإجمالي: {(item.price - item.discount) * item.quantity}
          </Text>

          <Pressable onPress={onRemove} style={{ marginTop: 10 }}>
            <Text style={{ color: "#ef4444" }}>🗑️ مسح الصنف</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
