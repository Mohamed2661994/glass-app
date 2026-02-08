import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Platform, Switch, TouchableOpacity, View } from "react-native";
import { Product } from "../types";

type Props = {
  item: Product;
  onEdit: (product: Product) => void;
  onPrint: (product: Product) => void;
  onToggle: (id: number, value: boolean) => void;
};

export default function ProductCard({
  item,
  onEdit,
  onPrint,
  onToggle,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          padding: 14,
          borderWidth: 1,
          borderRadius: 10,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        Platform.OS === "web"
          ? { width: "calc(50% - 6px)" as any }
          : { width: "100%" },
      ]}
    >
      {/* ===== Switch ===== */}
      {Platform.OS === "web" ? (
        <TouchableOpacity
          onPress={() => onToggle(item.id, !item.is_active)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: item.is_active
              ? colors.primary || "#0822b6"
              : isDark
                ? "#555"
                : "#ccc",
            padding: 2,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: item.is_active ? "#ffffff" : "#e5e7eb",
              transform: [{ translateX: item.is_active ? 20 : 0 }],
            }}
          />
        </TouchableOpacity>
      ) : (
        <Switch
          value={item.is_active}
          trackColor={{
            false: isDark ? "#555" : "#ccc",
            true: "#0822b6",
          }}
          thumbColor={item.is_active ? "#ffffff" : "#f4f4f5"}
          onValueChange={(v) => onToggle(item.id, v)}
        />
      )}

      {/* ===== Product Info ===== */}
      <View style={{ flex: 1, gap: 4, alignItems: "flex-end" }}>
        {/* الاسم */}
        <View style={{ marginBottom: 6 }}>
          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
            الاسم
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: item.is_active ? colors.text : "#777",
              textDecorationLine: item.is_active ? "none" : "line-through",
              writingDirection: "rtl",
            }}
          >
            {item.name}
          </ThemedText>
        </View>

        {/* المصنع */}
        {item.manufacturer && (
          <View style={{ marginBottom: 6 }}>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
              المصنع
            </ThemedText>
            <ThemedText style={{ color: colors.text }}>
              {item.manufacturer}
            </ThemedText>
          </View>
        )}

        {/* الباركود */}
        {item.barcode && (
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <ThemedText style={{ fontSize: 13, color: "#8aa4ff" }}>
              {item.barcode}
            </ThemedText>

            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              {/* طباعة */}
              <TouchableOpacity
                onPress={() => onPrint(item)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.botmta,
                }}
              >
                <Ionicons name="print-outline" size={16} color="#fff" />
              </TouchableOpacity>

              {/* نسخ */}
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(item.barcode!);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.botmbar,
                }}
              >
                <Ionicons name="copy-outline" size={16} color="#2f80ed" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* العبوة */}
        <View style={{ marginBottom: 6 }}>
          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
            العبوة
          </ThemedText>
          <ThemedText style={{ color: colors.text }}>
            جملة: {item.wholesale_package}
          </ThemedText>
          <ThemedText style={{ color: colors.text }}>
            قطاعي: {item.retail_package}
          </ThemedText>
        </View>

        {/* الأسعار */}
        <View style={{ marginBottom: 6 }}>
          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
            الأسعار
          </ThemedText>

          <ThemedText style={{ color: colors.text }}>
            شراء جملة: {item.purchase_price}
          </ThemedText>
          <ThemedText style={{ color: colors.text }}>
            بيع جملة: {item.wholesale_price}
          </ThemedText>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginVertical: 6,
              alignSelf: "stretch",
            }}
          />

          <ThemedText style={{ color: colors.text }}>
            شراء قطاعي: {item.retail_purchase_price}
          </ThemedText>
          <ThemedText style={{ color: colors.text }}>
            بيع قطاعي: {item.retail_price}
          </ThemedText>
        </View>

        {/* الخصم */}
        <View>
          <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
            الخصم
          </ThemedText>
          <ThemedText style={{ color: colors.text }}>
            {item.discount_amount}
          </ThemedText>
        </View>

        {!item.is_active && (
          <ThemedText style={{ fontSize: 11, color: "#e74c3c" }}>
            (صنف موقوف)
          </ThemedText>
        )}
      </View>

      {/* ===== Edit ===== */}
      <TouchableOpacity disabled={!item.is_active} onPress={() => onEdit(item)}>
        <ThemedText
          style={{
            color: item.is_active ? colors.botmta : "#555",
            fontWeight: "600",
          }}
        >
          تعديل
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}
