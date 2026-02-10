import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, TextInput, TouchableOpacity, View } from "react-native";
import { Product } from "../types";

type Props = {
  product: Product | null;
  onClose: () => void;
};

export default function PrintBarcodeModal({ product, onClose }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const [copies, setCopies] = useState("1");

  if (!product) return null;

  return (
    <Modal transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 360,
            borderRadius: 18,
            padding: 20,
            backgroundColor: colors.card,
          }}
        >
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 14,
              color: colors.text,
            }}
          >
            طباعة باركود
          </ThemedText>

          <TextInput
            placeholder="عدد النسخ"
            keyboardType="numeric"
            value={copies}
            onChangeText={setCopies}
            style={{
              height: 48,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              backgroundColor: colors.input,
              borderColor: colors.border,
              color: colors.text,
              marginBottom: 18,
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: colors.border,
              }}
            >
              <ThemedText>إلغاء</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/print/barcode",
                  params: {
                    barcode: product.barcode,
                    copies,
                    retailPrice: String(product.retail_price),
                    discount: String(product.discount_amount),
                    itemName: product.name,
                  },
                });
                onClose();
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: colors.primary,
              }}
            >
              <ThemedText style={{ color: "#b63333", fontWeight: "600" }}>
                طباعة
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
