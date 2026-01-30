import { useTheme } from "@/components/context/theme-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type TransferItem = {
  id: number;
  product_id: number;
  product_name: string;
  from_quantity: number;
  to_quantity: number;
  from_warehouse: string;
  to_warehouse: string;
  status: "active" | "cancelled";
};

type StockTransfer = {
  id: number;
  branch_id: number;
  note: string | null;
  status: "active" | "cancelled";
  created_at: string;
};

export default function TransferDetailsPage() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<TransferItem | null>(null);
  const [itemCancelLoading, setItemCancelLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [cancelLoading, setCancelLoading] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 5);

  /* ================= LOAD DATA ================= */

  const loadTransfer = async () => {
    try {
      const { data } = await api.get(`/stock-transfers/${id}`);

      setTransfer(data.transfer);
      setItems(data.items);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل تحميل التحويل");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadTransfer();
  }, [id]);

  /* ================= CANCEL ================= */

  const cancelTransfer = async () => {
    if (!transfer) return;

    try {
      setCancelLoading(true);
      await api.post(`/stock-transfers/${transfer.id}/cancel`);
      setShowCancelModal(false);
      loadTransfer();
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل إلغاء التحويل");
    } finally {
      setCancelLoading(false);
    }
  };

  const cancelItem = async () => {
    if (!itemToCancel) return;

    try {
      setItemCancelLoading(true);
      await api.post(`/stock-transfers/items/${itemToCancel.id}/cancel`);
      setItemToCancel(null);
      loadTransfer();
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل إلغاء الصنف");
    } finally {
      setItemCancelLoading(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (!transfer) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: "تفاصيل التحويل",
          headerTitleAlign: "center",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          maxWidth: 720,
          alignSelf: "center",
          width: "100%",
        }}
      >
        {/* ================= HEADER ================= */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: colors.text,
              }}
            >
              تحويل #{transfer.id}
            </Text>

            <View
              style={{
                backgroundColor:
                  transfer.status === "cancelled"
                    ? colors.danger
                    : colors.success,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {transfer.status === "cancelled" ? "❌ ملغي" : "✅ نشط"}
              </Text>
            </View>
          </View>

          <Text
            style={{ color: colors.muted, textAlign: "right", fontSize: 13 }}
          >
            {new Date(transfer.created_at).toLocaleDateString("ar-EG")}
          </Text>

          {transfer.note && (
            <Text
              style={{
                color: colors.muted,
                marginTop: 6,
                textAlign: "right",
                fontSize: 13,
              }}
            >
              {transfer.note}
            </Text>
          )}
        </View>

        {/* ================= ITEMS HEADER ================= */}
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 16,
              color: colors.text,
            }}
          >
            الأصناف
          </Text>

          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {items.length} صنف
          </Text>
        </View>

        {/* ================= ITEMS LIST ================= */}
        {visibleItems.map((item) => (
          <Card
            key={item.id}
            style={{
              marginBottom: 8,
              opacity: item.status === "cancelled" ? 0.5 : 1,
            }}
          >
            {/* اسم الصنف + الحالة */}
            <View
              style={{
                flexDirection: "row-reverse",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: colors.text,
                  textAlign: "right",
                }}
              >
                {item.product_name}
              </Text>

              <View
                style={{
                  backgroundColor:
                    item.status === "cancelled"
                      ? colors.danger
                      : colors.success,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}
                >
                  {item.status === "cancelled" ? "❌ ملغي" : "✅ نشط"}
                </Text>
              </View>
            </View>

            {/* الكميات */}
            <Text
              style={{ color: colors.muted, fontSize: 12, textAlign: "right" }}
            >
              من: {item.from_quantity} — {item.from_warehouse}
            </Text>
            <Text
              style={{ color: colors.muted, fontSize: 12, textAlign: "right" }}
            >
              إلى: {item.to_quantity} — {item.to_warehouse}
            </Text>

            {/* زر إلغاء الصنف */}
            {item.status === "active" && (
              <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                <Button
                  title="❌ إلغاء الصنف"
                  variant="danger"
                  onPress={() => setItemToCancel(item)}
                />
              </View>
            )}
          </Card>
        ))}

        {/* ================= EXPAND BUTTON ================= */}
        {items.length > 5 && (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            style={{ marginTop: 6 }}
          >
            <Text
              style={{
                color: colors.primary,
                textAlign: "center",
                fontSize: 13,
              }}
            >
              {expanded
                ? "إخفاء الأصناف"
                : `عرض باقي الأصناف (${items.length - 5})`}
            </Text>
          </Pressable>
        )}

        {/* ================= DANGER ZONE ================= */}
        {transfer.status !== "cancelled" && (
          <Card
            style={{
              marginTop: 32,
              backgroundColor: colors.danger + "22",
            }}
          >
            <Text
              style={{
                color: colors.danger,
                textAlign: "center",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              ⚠️ إلغاء التحويل سيؤدي إلى عكس الكميات في المخزن
            </Text>

            <Button
              title="❌ إلغاء التحويل"
              variant="danger"
              disabled={cancelLoading}
              onPress={() => setShowCancelModal(true)}
            />
          </Card>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      {showCancelModal && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card style={{ width: "85%", maxWidth: 320 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              تأكيد الإلغاء
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من إلغاء التحويل؟
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                title="رجوع"
                variant="ghost"
                onPress={() => setShowCancelModal(false)}
              />
              <Button
                title={cancelLoading ? "جاري الإلغاء..." : "تأكيد"}
                variant="danger"
                disabled={cancelLoading}
                onPress={cancelTransfer}
              />
            </View>
          </Card>
        </View>
      )}

      {itemToCancel && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card style={{ width: "85%", maxWidth: 320 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              إلغاء صنف
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل تريد إلغاء الصنف:
              {"\n"}
              <Text style={{ fontWeight: "700" }}>
                {itemToCancel.product_name}
              </Text>
              ؟
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                title="رجوع"
                variant="ghost"
                onPress={() => setItemToCancel(null)}
              />
              <Button
                title={itemCancelLoading ? "جاري الإلغاء..." : "تأكيد"}
                variant="danger"
                disabled={itemCancelLoading}
                onPress={cancelItem}
              />
            </View>
          </Card>
        </View>
      )}
    </>
  );
}
