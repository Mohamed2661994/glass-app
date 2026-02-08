import DateFieldFT from "@/components/date/DateRangeField";
import BackButton from "@/components/ui/BackButton";
import { useUser } from "@/hooks/useUser";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { router, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CustomerBalanceItem = {
  customer_name: string;
  total_sales: number;
  total_paid: number;
  balance_due: number;
  last_invoice_date?: string | null; // ✅ تاريخ آخر فاتورة
};

export default function CustomerBalancesReportScreen() {
  const [data, setData] = useState<CustomerBalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const toggleCustomer = (name: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const isBranchUser = !!user?.branch_id;
  const isShowroomUser = user?.branch_id === 1; // معرض
  const isWarehouseUser = user?.branch_id === 2; // مخزن رئيسي
  useEffect(() => {
    if (!user) return;

    if (user.branch_id === 1) {
      setWarehouseId("1"); // مخزن المعرض
    } else if (user.branch_id === 2) {
      setWarehouseId("2"); // المخزن الرئيسي
    } else {
      setWarehouseId(null); // الأدمن
    }
  }, [user]);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string | null>(null);

  const dateInputRef = useRef<any>(null);
  const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);

  /* ================== API CALL ================== */
  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await api.get("/reports/customer-balances", {
        params: {
          customer_name: customerSearch || undefined,
          from: fromDate ? formatDateForAPI(fromDate) : undefined,
          to: toDate ? formatDateForAPI(toDate) : undefined,
          warehouse_id: warehouseId || undefined,
        },
      });

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("Customer Balance Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  /* 🔍 بحث تلقائي */

  useEffect(() => {
    const t = setTimeout(fetchReport, 500);
    return () => clearTimeout(t);
  }, [customerSearch, fromDate, toDate, warehouseId]);

  /* ================== DATE HELPERS ================== */
  const formatDateForAPI = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  /* ================== RENDER ROW ================== */
  const renderItem = ({ item }: { item: CustomerBalanceItem }) => {
    const date = item.last_invoice_date
      ? new Date(item.last_invoice_date).toLocaleDateString("ar-EG")
      : "—";
    const isSelected = selectedCustomers.includes(item.customer_name);
    return (
      <View style={styles.rowItem}>
        {/* ✅ Checkbox لوحده */}
        <View style={{ flex: 0.4, alignItems: "center" }}>
          <Checkbox
            value={isSelected}
            onValueChange={() => toggleCustomer(item.customer_name)}
            color={isSelected ? "#1e293b" : undefined}
          />
        </View>

        {/* ✅ باقي الصف هو اللي يفتح التفاصيل */}
        <Pressable
          style={{ flex: 4, flexDirection: "row-reverse" }}
          onPress={() =>
            router.push({
              pathname: "/reports/customer-debt-details",
              params: { customer_name: item.customer_name },
            })
          }
        >
          <Text style={[styles.cell, styles.customerCell]}>
            {item.customer_name}
          </Text>
          <Text style={styles.cell}>{date}</Text>
          <Text style={styles.cell}>
            {Number(item.total_sales).toLocaleString()}
          </Text>
          <Text style={styles.cell}>
            {Number(item.total_paid).toLocaleString()}
          </Text>
          <Text style={[styles.cell, styles.balanceCell]}>
            {Number(item.balance_due).toLocaleString()}
          </Text>
        </Pressable>
      </View>
    );
  };

  /* ================== UI ================== */
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                تقرير مديونية العملاء
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

      {/* 🔍 بحث باسم العميل */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="بحث باسم العميل"
          value={customerSearch}
          onChangeText={setCustomerSearch}
          style={styles.input}
        />
      </View>

      {/* 🏬 فلترة حسب المخزن */}
      <View style={styles.searchRow}>
        {[
          { id: null, name: "كل المخازن", disabled: true }, // محدش يختار الكل

          {
            id: "2",
            name: "المخزن الرئيسي",
            disabled: isShowroomUser, // المعرض ما يشوفش الرئيسي
          },

          {
            id: "1",
            name: "مخزن المعرض",
            disabled: isWarehouseUser, // المخزن ما يشوفش المعرض
          },
        ].map((w) => (
          <TouchableOpacity
            key={w.name}
            disabled={w.disabled}
            style={[
              styles.filterBtn,
              warehouseId === w.id && styles.activeFilterBtn,
              w.disabled && { opacity: 0.4 },
            ]}
            onPress={() => setWarehouseId(w.id)}
          >
            <Text
              style={[
                styles.filterText,
                warehouseId === w.id && styles.activeFilterText,
              ]}
            >
              {w.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📅 فلترة التاريخ */}
      <View style={styles.dateFilterBox}>
        <View style={styles.dateRow}>
          <DateFieldFT
            label="من تاريخ"
            value={fromDate}
            onChange={(date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              setFromDate(d);
            }}
          />

          <DateFieldFT
            label="إلى تاريخ"
            value={toDate}
            onChange={(date) => {
              const d = new Date(date);
              d.setHours(23, 59, 59, 999);
              setToDate(d);
            }}
          />
        </View>
      </View>

      {/* 🧹 مسح الفلاتر */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => {
            setCustomerSearch("");
            setFromDate(null);
            setToDate(null);

            // رجّع الفلتر الافتراضي حسب نوع المستخدم
            if (user?.branch_id === 1) {
              setWarehouseId("1"); // مخزن المعرض
            } else if (user?.branch_id === 2) {
              setWarehouseId("2"); // المخزن الرئيسي
            } else {
              setWarehouseId(null); // الأدمن فقط
            }
          }}
        >
          <Text style={styles.clearBtnText}>مسح الفلترة</Text>
        </TouchableOpacity>
      </View>
      {selectedCustomers.length > 0 && (
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={() => {
              const selectedData = data.filter((c) =>
                selectedCustomers.includes(c.customer_name),
              );

              router.push({
                pathname: "/reports/print-selected-customers",
                params: { customers: JSON.stringify(selectedData) },
              });
            }}
          >
            <Text style={styles.printBtnText}>
              طباعة العملاء المختارين ({selectedCustomers.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {data.length > 0 && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.4 }]}>✔</Text>
            <Text style={styles.headerCell}>العميل</Text>
            <Text style={styles.headerCell}>تاريخ آخر فاتورة</Text>
            <Text style={styles.headerCell}>إجمالي الفواتير</Text>
            <Text style={styles.headerCell}>المدفوع</Text>
            <Text style={styles.headerCell}>المتبقي</Text>
          </View>

          <FlatList
            data={data}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      )}
    </View>
  );
}

/* ================== STYLES ================== */
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

  searchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  dateFilterBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: "92%",
    maxWidth: 720,
    alignSelf: "center",
    backgroundColor: "#ffffff",
  },

  dateRow: {
    flexDirection: "row",
    gap: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 220,
    height: 40,
    backgroundColor: "#fff",
  },

  dateInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    minWidth: 140,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  tableHeader: {
    flexDirection: "row-reverse", // ✅ يعكس الأعمدة
    backgroundColor: "#1e293b",
    paddingVertical: 8,
  },
  printBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  printBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  rowItem: {
    flexDirection: "row-reverse", // ✅ نفس العكس في الصفوف
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  clearBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },

  clearBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },

  activeFilterBtn: {
    backgroundColor: "#1e293b",
  },

  filterText: {
    fontSize: 12,
    color: "#0f172a",
  },

  activeFilterText: {
    color: "#fff",
  },

  dateText: { fontSize: 13, color: "#0f172a" },

  tableContainer: { alignSelf: "center", width: "92%", maxWidth: 900 },

  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fdf7f7",
    padding: 16,
    borderRadius: 12,
    width: "85%",
  },

  iosPickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
  },

  cell: { flex: 1, textAlign: "center", fontSize: 12 },
  customerCell: { fontWeight: "bold" },
  balanceCell: { color: "red", fontWeight: "bold" },

  webOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  webModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: 320,
  },
  webTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 12 },
  webInput: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    textAlign: "center",
    marginBottom: 10,
  },

  modalBtn: {
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 10,
  },
});
