import BackButton from "@/components/ui/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type InventoryItem = {
  product_id: number;
  product_name: string;
  manufacturer_name?: string | null; // 👈 اسم المصنع
  warehouse_name: string | null;
  total_in: number;
  total_out: number;
  current_stock: number;
};

export default function InventoryReportScreen() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    "الكل" | "المخزن الرئيسي" | "مخزن المعرض"
  >("الكل");

  const fetchReport = async () => {
    try {
      const response = await fetch(
        "http://192.168.1.63:3001/reports/inventory-summary",
      );
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.log("Inventory Report Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const filteredData = useMemo(() => {
    if (selectedWarehouse === "الكل") return data;
    return data.filter(
      (item) => (item.warehouse_name || "").trim() === selectedWarehouse.trim(),
    );
  }, [data, selectedWarehouse]);

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const totalIn = Number(item.total_in || 0);
    const totalOut = Number(item.total_out || 0);
    const currentStock = Number(item.current_stock || 0);

    const expectedStock = totalIn - totalOut;
    const difference = currentStock - expectedStock;
    const hasProblem = difference !== 0;

    return (
      <View style={[styles.rowItem, hasProblem && styles.errorRow]}>
        {/* فرق المخزن */}
        <Text style={[styles.cell, hasProblem && styles.errorText]}>
          {difference}
        </Text>

        {/* الرصيد المفروض */}
        <Text style={styles.cell}>{expectedStock}</Text>

        {/* الرصيد الحالي */}
        <Text style={styles.cell}>{currentStock}</Text>

        {/* المنصرف */}
        <Text style={styles.cell}>{totalOut}</Text>

        {/* الوارد */}
        <Text style={styles.cell}>{totalIn}</Text>

        {/* اسم الصنف + المصنع */}
        <View style={[styles.cell, styles.nameCell]}>
          <Text numberOfLines={1} style={styles.productName}>
            {item.product_name} - {item.manufacturer_name}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>جاري تحميل تقرير الجرد...</Text>
      </View>
    );
  }

  const problemCount = filteredData.filter((item) => {
    const diff =
      Number(item.current_stock || 0) -
      (Number(item.total_in || 0) - Number(item.total_out || 0));
    return diff !== 0;
  }).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="layers-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                تقرير جرد المخزن
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <View style={styles.container}>
        {/* فلتر المخزن */}
        <View style={styles.filterRow}>
          {["الكل", "المخزن الرئيسي", "مخزن المعرض"].map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.filterBtn,
                selectedWarehouse === name && styles.activeFilterBtn,
              ]}
              onPress={() =>
                setSelectedWarehouse(name as typeof selectedWarehouse)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  selectedWarehouse === name && styles.activeFilterText,
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {problemCount > 0 && (
          <Text style={styles.warning}>
            ⚠️ يوجد {problemCount} صنف بهم فرق في المخزون
          </Text>
        )}
        <View style={styles.tableWrapper}>
          {/* رأس الجدول (الترتيب المعكوس) */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>الفرق</Text>
            <Text style={styles.headerCell}>المفروض</Text>
            <Text style={styles.headerCell}>الحالي</Text>
            <Text style={styles.headerCell}>منصرف</Text>
            <Text style={styles.headerCell}>وارد</Text>
            <Text style={[styles.headerCell, styles.nameCell]}>
              الصنف / المصنع
            </Text>
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item, index) =>
              `${item.product_id}-${item.warehouse_name}-${index}`
            }
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 20, // 👈 المسافة تحت الهيدر
  },

  header: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 15,
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },

  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },

  activeFilterBtn: {
    backgroundColor: "#1e293b",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
  },

  activeFilterText: {
    color: "#fff",
  },

  warning: {
    textAlign: "center",
    color: "red",
    marginBottom: 10,
    fontWeight: "bold",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 8,
  },

  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },

  rowItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  tableWrapper: {
    alignSelf: "center", // يخليه في النص
    width: "95%", // يقلل عرضه عن الشاشة
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2, // ظل خفيف (Android)
    shadowColor: "#000", // ظل خفيف (iOS)
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  nameCell: {
    flex: 2,
    alignItems: "center",
    paddingRight: 6,
  },

  productName: {
    fontWeight: "bold",
    fontSize: 12,
  },

  manufacturerName: {
    fontSize: 10,
    color: "#64748b",
  },

  errorRow: {
    backgroundColor: "#ffe5e5",
  },

  errorText: {
    color: "red",
    fontWeight: "bold",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
