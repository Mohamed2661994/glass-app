import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import api from "@/services/api";
import { Picker } from "@react-native-picker/picker";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Modal, Platform, Pressable, ScrollView } from "react-native";

import { StyleSheet } from "react-native";

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type InventoryItem = {
  product_id: number;
  product_name: string;
  manufacturer: string;
  quantity: number;
  purchase_price: number;
  total_value: number;
  warehouse_id: number;
  warehouse_name: string;
};

export default function InventoryValueReport() {
  const { colors } = useTheme();
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isIOS = Platform.OS === "ios";
  const [manufacturerModalVisible, setManufacturerModalVisible] =
    useState(false);

  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const router = useRouter();

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [manufacturerFilter, setManufacturerFilter] = useState<string | null>(
    null,
  );

  const fetchManufacturers = async () => {
    try {
      const res = await api.get("/reports/manufacturers");
      const names = (res.data || []).map((item: any) => item.manufacturer);

      // نشيل الفاضي والتكرار
      const unique = [
        ...new Set(names.filter((n: any) => n && n.trim() !== "")),
      ] as string[];

      setManufacturers(unique);
    } catch (e) {
      console.log("Manufacturers error", e);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await api.get("/reports/inventory-details", {
        params: {
          warehouse_id: warehouseFilter ?? undefined,
          manufacturer: manufacturerFilter ?? undefined,
        },
      });

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Inventory Report Error", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchManufacturers();
      fetchReport();
    }, [warehouseFilter, manufacturerFilter]), // 👈 ضيف المصنع هنا
  );

  const totalValue = data.reduce(
    (sum, item) => sum + Number(item.total_value),
    0,
  );

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[styles.cell, { color: colors.text, flex: 2 }]}>
        {item.product_name} - {item.manufacturer}
      </Text>

      <Text style={[styles.cell, { color: colors.text }]}>{item.quantity}</Text>

      <Text style={[styles.cell, { color: colors.text }]}>
        {item.purchase_price.toLocaleString()}
      </Text>

      <Text style={[styles.cell, { color: colors.primary, fontWeight: "700" }]}>
        {item.total_value.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "تقرير المخزون",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            width: "100%",
            maxWidth: 900,
            alignSelf: "center",
            padding: 16,
          }}
        >
          {/* 🔘 الفلترة */}
          <View style={styles.filterRow}>
            {[
              { id: null, name: "كل المخازن" },
              { id: 1, name: "المخزن الرئيسي" },
              { id: 2, name: "مخزن المعرض" },
            ].map((w) => (
              <TouchableOpacity
                key={w.name}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor:
                      warehouseFilter === w.id ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setWarehouseFilter(w.id)}
              >
                <Text
                  style={{
                    color: warehouseFilter === w.id ? "#fff" : colors.text,
                    fontWeight: "600",
                  }}
                >
                  {w.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text
              style={{ color: colors.text, marginBottom: 6, fontWeight: "600" }}
            >
              فلترة حسب المصنع
            </Text>

            {isIOS ? (
              <>
                <Pressable
                  onPress={() => setManufacturerModalVisible(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    height: 48,
                    justifyContent: "center",
                    paddingHorizontal: 12,
                    backgroundColor: colors.card,
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {manufacturerFilter || "كل المصانع"}
                  </Text>
                </Pressable>

                <Modal
                  visible={manufacturerModalVisible}
                  transparent
                  animationType="fade"
                >
                  <View style={styles.modalOverlay}>
                    <View
                      style={[
                        styles.modalContent,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        اختر المصنع
                      </Text>

                      <ScrollView style={{ maxHeight: 300 }}>
                        <Pressable
                          onPress={() => {
                            setManufacturerFilter(null);
                            setManufacturerModalVisible(false);
                          }}
                          style={styles.modalItem}
                        >
                          <Text style={{ color: colors.text }}>كل المصانع</Text>
                        </Pressable>

                        {manufacturers.map((m, i) => (
                          <Pressable
                            key={`${m}-${i}`}
                            onPress={() => {
                              setManufacturerFilter(m);
                              setManufacturerModalVisible(false);
                            }}
                            style={styles.modalItem}
                          >
                            <Text style={{ color: colors.text }}>{m}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      <Pressable
                        onPress={() => setManufacturerModalVisible(false)}
                        style={styles.modalCloseBtn}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                          إغلاق
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  height: 48,
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  overflow: "hidden",
                }}
              >
                <Picker
                  selectedValue={manufacturerFilter}
                  onValueChange={(value) => setManufacturerFilter(value)}
                  dropdownIconColor={colors.text}
                  style={{
                    color: colors.text,
                    width: "100%",
                    height: 48,
                    backgroundColor: colors.card,
                    ...(Platform.OS === "web" && {
                      appearance: "none",
                      outlineWidth: 0,
                    }),
                  }}
                >
                  <Picker.Item label="كل المصانع" value={null} />
                  {manufacturers.map((m, i) => (
                    <Picker.Item key={`${m}-${i}`} label={m} value={m} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* 💰 إجمالي القيمة */}
          <View
            style={{
              backgroundColor: colors.primary,
              padding: 14,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              إجمالي قيمة المخزون
            </Text>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
              {totalValue.toLocaleString()} ج
            </Text>
          </View>

          {Platform.OS === "web" && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/reports/inventory-print",
                  params: {
                    warehouse_id: warehouseFilter ?? "",
                    manufacturer: manufacturerFilter ?? "",
                  },
                })
              }
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                🖨️ طباعة التقرير
              </Text>
            </TouchableOpacity>
          )}

          {/* 📋 الجدول */}
          <View style={[styles.headerRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.headerCell, { flex: 2, color: colors.text }]}>
              الصنف + المصنع
            </Text>
            <Text style={[styles.headerCell, { color: colors.text }]}>
              الكمية
            </Text>
            <Text style={[styles.headerCell, { color: colors.text }]}>
              سعر الشراء
            </Text>
            <Text style={[styles.headerCell, { color: colors.text }]}>
              الإجمالي
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, index) =>
                `${item.product_id}-${item.warehouse_id}-${index}`
              }
              renderItem={renderItem}
              ListFooterComponent={
                <View
                  style={[
                    styles.footerRow,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <Text style={[styles.cell, { flex: 2, fontWeight: "700" }]}>
                    المجموع
                  </Text>
                  <Text style={styles.cell}></Text>
                  <Text style={styles.cell}></Text>
                  <Text
                    style={[
                      styles.cell,
                      { color: colors.primary, fontWeight: "800" },
                    ]}
                  >
                    {totalValue.toLocaleString()} ج
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginBottom: 12,
  },
  container: {
    width: "100%",
    maxWidth: 900, // 👈 أقصى عرض على الويب
    alignSelf: "center", // 👈 يخليه في النص
    padding: 16,
  },

  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  headerRow: {
    flexDirection: "row-reverse",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row-reverse",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#fff",
  },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: "#2f80ed",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  footerRow: {
    flexDirection: "row-reverse",
    paddingVertical: 12,
    borderTopWidth: 2,
    marginTop: 6,
  },
});
