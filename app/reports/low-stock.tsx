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

type LowStockItem = {
  product_id: number;
  product_name: string;
  manufacturer_name?: string | null;
  warehouse_name: string;
  current_stock: number;
};

export default function LowStockReportScreen() {
  const [data, setData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    "الكل" | "المخزن الرئيسي" | "مخزن المعرض"
  >("الكل");

  const fetchReport = async () => {
    try {
      const response = await fetch(
        "http://192.168.1.63:3001/reports/low-stock",
      );
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.log("Low Stock Report Error:", error);
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
      (item) => item.warehouse_name?.trim() === selectedWarehouse.trim(),
    );
  }, [data, selectedWarehouse]);

  const renderItem = ({ item }: { item: LowStockItem }) => {
    const isCritical = item.current_stock <= 2;

    return (
      <View style={[styles.rowItem, isCritical && styles.criticalRow]}>
        <View style={[styles.cell, styles.nameCell]}>
          <Text numberOfLines={1} style={styles.productName}>
            {item.product_name}
          </Text>
          <Text style={styles.manufacturerName}>
            {item.manufacturer_name || "—"}
          </Text>
        </View>

        <Text style={styles.cell}>{item.warehouse_name}</Text>

        <Text
          style={[
            styles.cell,
            styles.stockCell,
            isCritical && styles.criticalText,
          ]}
        >
          {item.current_stock}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          جاري تحميل الأصناف منخفضة المخزون...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                تقرير نقص المخزون
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

        {/* رأس الجدول */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.nameCell]}>
            الصنف / المصنع
          </Text>
          <Text style={styles.headerCell}>المخزن</Text>
          <Text style={styles.headerCell}>الرصيد</Text>
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.product_id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
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

  activeFilterText: { color: "#fff" },

  tableHeader: {
    flexDirection: "row-reverse",
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
    flexDirection: "row-reverse",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    justifyContent: "center",
    alignItems: "center",
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

  stockCell: {
    fontWeight: "bold",
  },

  criticalRow: {
    backgroundColor: "#ffe5e5",
  },

  criticalText: {
    color: "red",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
