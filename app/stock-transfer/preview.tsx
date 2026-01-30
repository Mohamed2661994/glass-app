import { useTheme } from "@/components/context/theme-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ================= TYPES ================= */

interface PreviewItem {
  product_id: number;
  product_name?: string;
  manufacturer?: string; // ✅ أهو
  quantity: number;
  from_quantity: number; // 1
  to_quantity: number; // 16 ✅ ناتج الحسبة
  final_price: number; // 👈 جاي من صفحة التحويل
  from?: string;
  to?: string;
  status: "ok" | "rejected";
  reason?: string;
}

/* ================= MAIN ================= */

export default function StockTransferPreview() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const payload = JSON.parse(params.data as string);
  const totalAmount = payload.total_amount ?? 0;
  const [successModal, setSuccessModal] = useState(false);
  const [transferNumber, setTransferNumber] = useState<number | null>(null);

  /* ================= LOAD PREVIEW ================= */

  useEffect(() => {
    (async () => {
      try {
        const payload = JSON.parse(params.data as string);
        const res = await api.post(
          "/stock/wholesale-to-retail/preview",
          payload,
        );
        // 👇 دمج بيانات الباك مع السعر الجاي من التحويل
        const merged = res.data.map((row: any) => {
          const localItem = payload.items.find(
            (i: any) => i.product_id === row.product_id,
          );

          const cartons = localItem?.quantity ?? 0;

          // نص العبوة
          const packageText = localItem?.wholesale_package?.trim() || "";

          // الرقم الموجود في النص (12 من "12 قطعة" / 4 من "4 طقم")
          const unitCount = Number(packageText.match(/\d+/)?.[0] || 0);

          // هل دستة؟
          const isDozen = /دست/i.test(packageText);

          let toQuantity = cartons;

          // ✅ لو مش دستة → خد رقم العبوة وانزله زي ما هو
          if (!isDozen && unitCount > 0) {
            toQuantity = cartons * unitCount;
          }

          // ✅ لو دستة → شغّل الحسبة
          if (isDozen) {
            const piecesPerDozen = 12;
            const piecesPerShiala = 3;

            toQuantity =
              (cartons * unitCount * piecesPerDozen) / piecesPerShiala;
          }

          const unitName = packageText.replace(/\d+/g, "").trim();

          let fromText = `من: ${cartons} كرتونة`;
          let toText = ` ${Math.round(toQuantity)} ${unitName}`;

          if (unitCount > 0) {
            fromText = `${cartons}  ${unitName}  ${unitCount}`;
          }

          return {
            ...row,
            quantity: cartons,
            from_quantity: cartons,
            to_quantity: Math.round(toQuantity),
            final_price: localItem?.final_price ?? 0,
            manufacturer: localItem?.manufacturer ?? "",
            status: "ok",
            reason: undefined,
            from: fromText,
            to: toText,
          };
        });

        setItems(merged);
      } catch {
        Alert.alert("خطأ", "فشل تحميل معاينة التحويل");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= EXECUTE ================= */

  const executeTransfer = async () => {
    try {
      const payload = JSON.parse(params.data as string);
      const res = await api.post("/stock/wholesale-to-retail/execute", payload);
      // 👇 رقم التحويل (من الباك)
      setTransferNumber(res.data?.transfer_id ?? Date.now());
      // 👇 افتح مودال النجاح
      setSuccessModal(true);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل التحويل");
    }
  };

  /* ================= RENDER ================= */

  return (
    <>
      {/* ===== HEADER ===== */}
      <Stack.Screen
        options={{
          title: "معاينة التحويل ",
          headerTitleAlign: "center",
          headerBackTitle: "",
          headerTintColor: isDark ? "#fff" : "#020617",
          headerStyle: {
            backgroundColor: isDark ? "#020617" : "#f8fafc",
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/")}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={26} color="#007aff" />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, isDark && styles.dark]}>
        <View style={styles.formWrapper}>
          {loading ? (
            <Text
              style={{ textAlign: "center", color: isDark ? "#fff" : "#000" }}
            >
              جاري التحميل...
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map((item, index) => {
                const isOk = item.status === "ok";
                const noStock = item.from_quantity <= 0;

                return (
                  <Card
                    key={index}
                    style={{
                      marginBottom: 12,
                      backgroundColor: noStock
                        ? isDark
                          ? "#3f1d1d"
                          : "#fee2e2"
                        : isDark
                          ? "#0b1336"
                          : "#2a4291",
                      borderColor: noStock ? "#dc2626" : undefined,
                      borderWidth: noStock ? 1.5 : 0,
                    }}
                  >
                    {noStock && (
                      <Text
                        style={{
                          color: "#fecaca",
                          fontSize: 12,
                          fontWeight: "700",
                          textAlign: "center",
                          marginBottom: 8,
                        }}
                      >
                        ⚠️ {item.reason || "رصيد غير كافٍ بالمخزن"}
                      </Text>
                    )}

                    {isOk ? (
                      <View style={styles.table}>
                        {/* Header */}
                        <View
                          style={[
                            styles.tableHeader,
                            {
                              backgroundColor: isDark ? "#515b6d" : "#4e5666",
                            },
                          ]}
                        >
                          <Text style={styles.th}>الإجمالي</Text>
                          <Text style={styles.th}>إلى المعرض</Text>
                          <Text style={styles.th}>من المخزن</Text>
                          <Text style={[styles.th, styles.nameCol]}>
                            اسم الصنف
                          </Text>
                        </View>

                        {/* Row */}
                        <View
                          style={[
                            styles.tableRow,
                            {
                              backgroundColor: isDark ? "#0b1336" : "#2a4291",
                            },
                          ]}
                        >
                          <Text style={styles.td}>
                            {Math.round(item.final_price ?? 0)}
                          </Text>
                          <Text style={styles.td}>{item.to_quantity}</Text>
                          <Text style={styles.td}>{item.from_quantity}</Text>
                          <View style={[styles.td, styles.nameCol]}>
                            <Text style={styles.nameText}>
                              {item.product_name} - {item.manufacturer}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.error}>سبب الرفض: {item.reason}</Text>
                    )}
                  </Card>
                );
              })}
            </ScrollView>
          )}

          {/* ===== TOTAL ===== */}
          <Card
            style={{
              marginTop: 12,
              backgroundColor: isDark ? "#19234e" : "#8ea9da",
            }}
          >
            <Text
              style={{
                color: isDark ? "#fff" : "#020617",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "right",
              }}
            >
              الإجمالي: {Math.round(totalAmount)} جنيه
            </Text>
          </Card>

          {/* ===== CONFIRM ===== */}
          <View style={{ marginTop: 12 }}>
            <Button title="تأكيد التحويل" onPress={executeTransfer} />
          </View>
        </View>
      </View>

      {/* ===== SUCCESS MODAL ===== */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card
            style={{
              width: 360,
              maxWidth: "90%",
              padding: 20,
              backgroundColor: isDark ? "#0f121d" : "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 10,
                color: isDark ? "#fff" : "#020617",
              }}
            >
              ✅ تم التحويل بنجاح
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 15,
                marginBottom: 10,
                color: isDark ? "#fff" : "#020617",
              }}
            >
              رقم التحويل: {transferNumber}
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                marginBottom: 16,
                color: isDark ? "#fff" : "#020617",
              }}
            >
              هل تريد طباعة التحويل؟
            </Text>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="طباعة"
                  onPress={() => {
                    setSuccessModal(false);
                    router.push({
                      pathname: "/stock-transfer/print",
                      params: {
                        data: JSON.stringify({
                          transfer_number: transferNumber,
                          items,
                          total_amount: totalAmount,
                        }),
                      },
                    });
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="إلغاء"
                  variant="ghost"
                  onPress={() => {
                    setSuccessModal(false);
                    router.replace("/stock-transfer");
                  }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  dark: {
    backgroundColor: "#03112b",
  },

  formWrapper: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    flex: 1,
  },
  totalBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  successModal: {
    width: 360, // عرض ثابت
    maxWidth: "90%",
    borderRadius: 16,
    padding: 20,
  },

  table: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#064e3b", // افتراضي فاتح
  },

  tableRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  th: {
    flex: 1,
    paddingVertical: 8,
    textAlign: "center",
    fontWeight: "700",
    color: "#d1fae5",
    fontSize: 13,
  },

  td: {
    flex: 1,
    paddingVertical: 10,
    textAlign: "center",
    color: "#e5e7eb", // أبيض هادي    fontSize: 14,
    fontWeight: "600",
  },

  nameCol: {
    flex: 2.2, // 👈 عمود الاسم أعرض
    paddingHorizontal: 6,
  },

  nameText: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right",
  },

  subText: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#f8fafc",
  },

  successText: {
    textAlign: "center",
    fontSize: 15,
    marginBottom: 10,
    color: "#f8fafc",
  },

  successQuestion: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
    color: "#f8fafc",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
  },

  printBtn: {
    backgroundColor: "#105fb9",
  },

  cancelBtn: {
    backgroundColor: "#e5e7eb",
  },

  modalBtnText: {
    textAlign: "center",
    fontWeight: "700",
  },

  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  name: {
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "right",
    writingDirection: "ltr", // 👈 مهم للآيفون
  },

  text: {
    fontSize: 14,
    textAlign: "right",
    writingDirection: "ltr",
  },

  error: {
    color: "#fecaca",
    fontWeight: "600",
    textAlign: "right",
  },

  confirmBtn: {
    backgroundColor: "#0b3e9c",
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
  },

  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
