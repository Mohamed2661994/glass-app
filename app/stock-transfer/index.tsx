import { useTheme } from "@/components/context/theme-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/* ================= TYPES ================= */

interface Product {
  id: number;
  name: string;
  manufacturer: string;
  wholesale_package: string;
  retail_package: string;
  available_quantity: number;
  wholesale_price: number;
  percent: number; // ✅ نسبة مئوية
}

interface TransferItem {
  product_id: number;
  product_name: string;
  manufacturer: string;
  quantity: number;
  percent: number;
  wholesale_package: string;
  retail_package: string;
  wholesale_price: number;
  available_quantity: number; // 👈 مهم
}

/* ================= MAIN ================= */

export default function StockTransferScreen() {
  const { isDark } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const qtyRefs = useRef<{ [key: number]: TextInput | null }>({});

  const FROM_BRANCH_ID = 2; // مخزن الجملة
  const TO_BRANCH_ID = 1; // مخزن القطاعي

  /* ================= LOAD PRODUCTS ================= */

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/products/for-replace", {
          params: { branch_id: FROM_BRANCH_ID },
        });

        setProducts(res.data);
      } catch {
        Alert.alert("خطأ", "فشل تحميل الأصناف");
      }
    })();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(search.toLowerCase()),
  );

  /* ================= ADD FROM MODAL ================= */

  const addProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);

      if (existing) return prev;

      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          manufacturer: product.manufacturer, // ✅ الحل هنا
          quantity: 1,
          percent: 0, // ✅ افتراضي
          wholesale_package: product.wholesale_package,
          retail_package: product.retail_package,
          wholesale_price: product.wholesale_price,
          available_quantity: product.available_quantity, // 👈 هنا
        },
      ];
    });

    setModalVisible(false);

    setTimeout(() => {
      qtyRefs.current[product.id]?.focus();
    }, 200);
  };

  /* ================= TOTAL ================= */

  const totalAmount = items.reduce((sum, i) => {
    const base = i.quantity * i.wholesale_price;
    const discount = base * (i.percent / 100);
    const final = base - discount;
    return sum + final;
  }, 0);

  /* ================= PREVIEW ================= */

  const goToPreview = () => {
    if (items.length === 0) {
      Alert.alert("تنبيه", "أضف صنف واحد على الأقل");
      return;
    }

    router.push({
      pathname: "/stock-transfer/preview",
      params: {
        data: JSON.stringify({
          from_branch_id: FROM_BRANCH_ID,
          to_branch_id: TO_BRANCH_ID,
          total_amount: totalAmount,
          items: items.map((i) => {
            const base = i.quantity * i.wholesale_price;
            const discount = base * (i.percent / 100);
            const final_price = base - discount;

            return {
              product_id: i.product_id,
              quantity: i.quantity,
              final_price,
            };
          }),
        }),
      },
    });
  };

  /* ================= RENDER ================= */

  return (
    <>
      <Stack.Screen
        options={{
          title: "فاتورة تحويل للمعرض",
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
          {/* OPEN MODAL */}
          <Button title="اختر صنف" onPress={() => setModalVisible(true)} />

          {/* ITEMS */}
          <Text
            style={[styles.subTitle, { color: isDark ? "#94a3b8" : "#020617" }]}
          >
            الأصناف المضافة
          </Text>

          {items.map((item) => (
            <Card key={item.product_id} style={{ marginBottom: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {/* حذف */}
                <Pressable
                  onPress={() =>
                    setItems((prev) =>
                      prev.filter((i) => i.product_id !== item.product_id),
                    )
                  }
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </Pressable>

                {/* النسبة */}
                <Input
                  value={String(item.percent)}
                  keyboardType="numeric"
                  style={styles.percentInput}
                  placeholder="%"
                  onChangeText={(val) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.product_id === item.product_id
                          ? { ...i, percent: Number(val) || 0 }
                          : i,
                      ),
                    )
                  }
                />

                {/* الكمية */}
                <Input
                  value={String(item.quantity)}
                  keyboardType="numeric"
                  style={styles.qtyInput}
                  onChangeText={(val) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.product_id === item.product_id
                          ? { ...i, quantity: Number(val) || 1 }
                          : i,
                      ),
                    )
                  }
                />

                {/* التفاصيل */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: isDark ? "#fff" : "#020617",
                        textAlign: "right",
                        writingDirection: "ltr",
                      },
                    ]}
                  >
                    {item.product_name}
                  </Text>

                  <Text
                    style={[
                      styles.itemSub,
                      {
                        color: isDark ? "#94a3b8" : "#64748b",
                        textAlign: "right",
                        writingDirection: "ltr",
                        paddingTop: 5,
                      },
                    ]}
                  >
                    {item.wholesale_package} × {item.wholesale_price}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          {/* TOTAL */}
          <Card style={{ marginTop: 12, marginBottom: 25 }}>
            <Text
              style={{
                color: isDark ? "#fff" : "#020617",
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              الإجمالي: {totalAmount.toFixed(2)}
            </Text>
          </Card>

          <Button title="عرض التحويل" variant="success" onPress={goToPreview} />
        </View>

        {/* MODAL */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setModalVisible(false)}
            />

            <Card
              style={[
                styles.modalBox,
                {
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                },
              ]}
            >
              <Input
                placeholder="ابحث عن صنف..."
                value={search}
                onChangeText={setSearch}
                autoFocus
              />

              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingTop: 12 }} // 👈 هنا
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => addProduct(item)}
                  >
                    <Text style={{ fontWeight: "700", color: "#0a2c70" }}>
                      {item.name} – {item.manufacturer}
                    </Text>

                    <Text style={{ fontSize: 12, color: "#263a55" }}>
                      {item.wholesale_package} • رصيد: {item.available_quantity}
                    </Text>
                  </Pressable>
                )}
              />
            </Card>
          </View>
        </Modal>
      </View>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  dark: { backgroundColor: "#020617" },

  formWrapper: { maxWidth: 480, alignSelf: "center", width: "100%" },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },

  selectBtn: { borderWidth: 1, borderRadius: 10, padding: 14 },

  subTitle: { marginTop: 20, marginBottom: 8, fontWeight: "600" },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },

  itemName: { fontWeight: "700" },
  itemSub: { fontSize: 13 },

  qtyInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
  },
  percentInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "700",
  },

  itemInfo: {
    flex: 1,
    alignItems: "flex-start", // 👈 مهم للآيفون
  },

  totalBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  totalBoxDark: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  previewBtn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  previewBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    width: "90%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
    // 👇 فرق بسيط مهم
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  modalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#002664",
    backgroundColor: "#ffffff",
  },
});
