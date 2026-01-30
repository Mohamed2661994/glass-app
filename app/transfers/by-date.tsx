import { useTheme } from "@/components/context/theme-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type TransferItem = {
  id: number;
  transfer_id: number;
  product_id: number;
  product_name: string;
  manufacturer?: string; // 👈 أضفناها
  wholesale_package?: string; // 👈 موجودة
  from_quantity: number;
  to_quantity: number;
  total_price?: number;
  from_warehouse: string;
  to_warehouse: string;
  status: "active" | "cancelled";
};

export default function TransfersByDatePage() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [itemToCancel, setItemToCancel] = useState<TransferItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const COLS = {
    product: 3,
    manufacturer: 1.5,
    from: 1,
    to: 1,
    price: 1.3,
    transfer: 1,
    cancel: 0.8,
  };

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/stock-transfers/by-date?date=${date}`);

      setItems(data.items || []);
      console.log("ITEMS FROM API:", data.items);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل تحميل التحويلات");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= CANCEL ITEM ================= */

  const cancelItem = async () => {
    if (!itemToCancel) return;

    try {
      setCancelLoading(true);
      await api.post(`/stock-transfers/items/${itemToCancel.id}/cancel`);
      setItemToCancel(null);
      loadData();
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "فشل إلغاء الصنف";

      if (Platform.OS === "web") {
        window.alert(`❌ تم البيع من هذا الصنف لذا لايمكن الغاء التحويل `);
      } else {
        Alert.alert(`❌ تم البيع من هذا الصنف لذا لايمكن الغاء التحويل `);
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const calcToQuantity = (cartons: number, packageText?: string) => {
    if (!packageText) return cartons;

    // نحول الأرقام العربية لإنجليزي
    const normalized = packageText.replace(/[٠-٩]/g, (d) =>
      "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString(),
    );

    const unitCount = Number(normalized.match(/\d+/)?.[0] || 0);
    const isDozen = /دست/i.test(normalized);

    let toQuantity = cartons;

    // لو مش دستة → ضرب مباشر
    if (!isDozen && unitCount > 0) {
      toQuantity = cartons * unitCount;
    }

    // لو دستة → (دستة × 12) ÷ 3
    if (isDozen && unitCount > 0) {
      const piecesPerDozen = 12;
      const piecesPerShiala = 3;

      toQuantity = (cartons * unitCount * piecesPerDozen) / piecesPerShiala;
    }

    return Math.round(toQuantity);
  };

  const sharePdfMobile = async () => {
    try {
      const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial; direction: rtl; padding: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; text-align: center; }
            th { background: #eee; }
          </style>
        </head>
        <body>
          <h3 style="text-align:center">
            تحويلات يوم ${new Date(date).toLocaleDateString("ar-EG")}
          </h3>

          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th>المصنع</th>
                <th>من</th>
                <th>إلى</th>
                <th>السعر</th>
              </tr>
            </thead>
            <tbody>
              ${activeItems
                .map(
                  (i) => `
                <tr>
                  <td>${i.product_name} ${i.wholesale_package || ""}</td>
                  <td>${i.manufacturer || "-"}</td>
                  <td>${i.from_quantity}</td>
                  <td>${calcToQuantity(i.from_quantity, i.wholesale_package)}</td>
                  <td>${(i.total_price || 0).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <p style="margin-top:10px;text-align:center;font-weight:bold">
            الإجمالي: ${totalDayPrice.toLocaleString()} ج
          </p>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "مشاركة تحويلات اليوم",
      });
    } catch (e) {
      Alert.alert("خطأ", "فشل إنشاء أو مشاركة ملف PDF");
    }
  };

  const activeItems = items.filter((i) => i.status === "active");
  const totalDayPrice = activeItems.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0,
  );

  /* ================= RENDER ================= */

  return (
    <>
      <Stack.Screen
        options={{
          title: "تحويلات اليوم",
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
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          maxWidth: 720,
          alignSelf: "center",
          width: "100%",
        }}
      >
        {/* ===== DATE HEADER ===== */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            📅 {new Date(date).toLocaleDateString("ar-EG")}
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 13,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            إجمالي السعر: {totalDayPrice.toLocaleString()} ج
          </Text>
        </View>
        <Button
          title="🖨️ طباعة"
          onPress={() => {
            if (Platform.OS === "web") {
              // 👉 الويب: نفس السلوك القديم
              router.push({
                pathname: "/stock-transfer/print-only",
                params: {
                  data: encodeURIComponent(
                    JSON.stringify({
                      items: activeItems.map((item) => ({
                        product_name: item.product_name,
                        manufacturer: item.manufacturer,
                        wholesale_package: item.wholesale_package,
                        from_quantity: item.from_quantity,
                        to_quantity: calcToQuantity(
                          item.from_quantity,
                          item.wholesale_package,
                        ),
                        total_price: item.total_price,
                      })),
                    }),
                  ),
                },
              });
            } else {
              // 👉 موبايل: شير PDF
              sharePdfMobile();
            }
          }}
        />

        {/* ===== LOADING ===== */}
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        )}

        {/* ===== EMPTY ===== */}
        {!loading && items.length === 0 && (
          <Text
            style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}
          >
            لا توجد تحويلات في هذا اليوم
          </Text>
        )}

        {/* ===== TABLE HEADER ===== */}
        {!loading && items.length > 0 && (
          <View
            style={{
              flexDirection: "row-reverse",
              backgroundColor: colors.input,
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderRadius: 10,
              marginBottom: 6,
            }}
          >
            <Text style={thStyle(colors, COLS.product)}>اسم الصنف</Text>
            <Text style={thStyle(colors, COLS.manufacturer)}>مصنع</Text>
            <Text style={thStyle(colors, COLS.from)}>من</Text>
            <Text style={thStyle(colors, COLS.to)}>إلى</Text>
            <Text style={thStyle(colors, COLS.price)}>السعر</Text>
            <Text style={thStyle(colors, COLS.transfer)}>تحويل</Text>
            <Text style={thStyle(colors, COLS.cancel)}>إلغاء</Text>
          </View>
        )}

        {/* ===== TABLE ROWS ===== */}
        {!loading &&
          items.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row-reverse",
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                alignItems: "center",
                opacity: item.status === "cancelled" ? 0.4 : 1,
              }}
            >
              {/* اسم الصنف */}
              <Text style={tdStyle(colors, COLS.product)} numberOfLines={2}>
                {item.product_name}
                {item.wholesale_package ? ` ${item.wholesale_package}` : ""}
              </Text>

              <Text
                style={tdStyle(colors, COLS.manufacturer)}
                numberOfLines={1}
              >
                {item.manufacturer || "—"}
              </Text>

              <Text style={tdStyle(colors, COLS.from)}>
                {item.from_quantity}
              </Text>

              <Text style={tdStyle(colors, COLS.to)}>
                {calcToQuantity(item.from_quantity, item.wholesale_package)}
              </Text>

              <Text style={tdStyle(colors, COLS.price)}>
                {(item.total_price || 0).toLocaleString()}
              </Text>

              <Text style={tdStyle(colors, COLS.transfer)}>
                #{item.transfer_id}
              </Text>

              {item.status === "active" ? (
                <Pressable
                  style={{ flex: COLS.cancel, alignItems: "center" }}
                  onPress={() => setItemToCancel(item)}
                >
                  <Text style={{ color: colors.danger, fontWeight: "700" }}>
                    ❌
                  </Text>
                </Pressable>
              ) : (
                <Text
                  style={{
                    flex: COLS.cancel,
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  —
                </Text>
              )}
            </View>
          ))}
      </ScrollView>

      {/* ===== CANCEL MODAL ===== */}
      {itemToCancel && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
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
              <View style={{ flex: 1 }}>
                <Button
                  title="رجوع"
                  variant="ghost"
                  onPress={() => setItemToCancel(null)}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Button
                  title={cancelLoading ? "جاري الإلغاء..." : "تأكيد"}
                  variant="danger"
                  disabled={cancelLoading}
                  onPress={cancelItem}
                />
              </View>
            </View>
          </Card>
        </View>
      )}
    </>
  );
}

/* ================= STYLES ================= */

const thStyle = (colors: any, flex = 1) => ({
  flex,
  textAlign: "center" as const,
  fontWeight: "700" as const,
  fontSize: 12,
  color: colors.text,
});

const tdStyle = (colors: any, flex = 1) => ({
  flex,
  textAlign: "center" as const,
  fontSize: 12,
  color: colors.text,
  paddingHorizontal: 4, // 👈 مهم
});
