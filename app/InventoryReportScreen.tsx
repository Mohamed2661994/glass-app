import { useAuth } from "@/components/context/AuthContext";
import BackButton from "@/components/ui/BackButton";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  const { user } = useAuth();
  const isShowroomUser = user?.branch_id === 1; // المعرض
  const isWarehouseUser = user?.branch_id === 2; // المخزن
  const [searchText, setSearchText] = useState("");

  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    "الكل" | "المخزن الرئيسي" | "مخزن المعرض"
  >(user?.branch_id === 1 ? "مخزن المعرض" : "المخزن الرئيسي");

  const fetchReport = async () => {
    try {
      const { data } = await api.get("/reports/inventory-summary");
      setData(Array.isArray(data) ? data : []);
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
    let result = data;

    // فلترة بالمخزن
    if (selectedWarehouse !== "الكل") {
      result = result.filter(
        (item) =>
          (item.warehouse_name || "").trim() === selectedWarehouse.trim(),
      );
    }

    // 🔍 البحث بالاسم أو المصنع
    if (searchText.trim()) {
      const q = searchText.toLowerCase();

      result = result.filter(
        (item) =>
          item.product_name.toLowerCase().includes(q) ||
          (item.manufacturer_name || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [data, selectedWarehouse, searchText]);

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
          {[
            { label: "الكل", value: "الكل", disabled: true },

            {
              label: "المخزن الرئيسي",
              value: "المخزن الرئيسي",
              disabled: isShowroomUser, // 👈 المعرض ممنوع يشوفه
            },

            {
              label: "مخزن المعرض",
              value: "مخزن المعرض",
              disabled: isWarehouseUser, // 👈 المخزن ممنوع يشوفه
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              disabled={item.disabled}
              style={[
                styles.filterBtn,
                selectedWarehouse === item.value && styles.activeFilterBtn,
                item.disabled && { opacity: 0.4 }, // 👈 شكل باهت لما يكون ممنوع
              ]}
              onPress={() => setSelectedWarehouse(item.value as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedWarehouse === item.value && styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <Text
            style={{
              position: "absolute",
              left: -9999,
            }}
          />
          <TextInput
            placeholder="ابحث عن الصنف أو المصنع..."
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
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
      {Platform.OS === "web" && (
        <style>
          {`
      /* عرض السكرول */
      ::-webkit-scrollbar {
        width: 6px;
      }

      /* الخلفية */
      ::-webkit-scrollbar-track {
        background: transparent;
      }

      /* الشريط نفسه */
      ::-webkit-scrollbar-thumb {
        background-color: #94a3b8;
        border-radius: 10px;
      }

      /* عند الـ hover */
      ::-webkit-scrollbar-thumb:hover {
        background-color: #64748b;
      }
    `}
        </style>
      )}
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
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    alignSelf: "center", // 👈 يخليه في النص
    width: "90%", // 👈 عرض أقل من الشاشة
    maxWidth: 500, // 👈 ممتاز للتابلت / الويب
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,

    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,

    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111",
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
    flex: 1,
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
