import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import { useEffect } from "react";

import DateFieldFT from "@/components/date/DateRangeField";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
interface CashOutItem {
  id: number;
  name: string;
  amount: number;
  notes: string | null;
  transaction_date: string;
  permission_number: string;
  entry_type: "expense" | "purchase"; // 👈 السطر المهم
}

export default function CashOutListScreen() {
  const displayDateOnly = (s: string) => {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };

  const [data, setData] = useState<CashOutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark, colors } = useTheme();

  // 🔍 Filters
  const [searchName, setSearchName] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // 🗑 Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashOutItem | null>(null);

  const fetchCashOut = async () => {
    try {
      const params: any = {};

      if (fromDate) params.from_date = formatLocalDate(fromDate);
      if (toDate) params.to_date = formatLocalDate(toDate);

      const { data } = await api.get("/cash/out", { params });

      setData(data.data || []);
    } catch (err: any) {
      console.error("FETCH CASH OUT ERROR", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCashOut();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setData([]); // 👈 امسح القديم
      fetchCashOut(); // 👈 هات الجديد
    }, []),
  );
  useEffect(() => {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    setFromDate(startOfDay);
    setToDate(endOfDay);
  }, []);

  const dateToNumber = (dateStr: string) => {
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    return y * 10000 + m * 100 + d;
  };

  // 🔹 Front Filter
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchName =
        searchName.trim() === "" ||
        item.name.toLowerCase().includes(searchName.toLowerCase());

      const itemTime = dateToNumber(item.transaction_date);

      const fromTime = fromDate
        ? fromDate.getFullYear() * 10000 +
          (fromDate.getMonth() + 1) * 100 +
          fromDate.getDate()
        : null;

      const toTime = toDate
        ? toDate.getFullYear() * 10000 +
          (toDate.getMonth() + 1) * 100 +
          toDate.getDate()
        : null;

      const matchFrom = fromTime ? itemTime >= fromTime : true;
      const matchTo = toTime ? itemTime <= toTime : true;

      return matchName && matchFrom && matchTo;
    });
  }, [data, searchName, fromDate, toDate]);

  // 👇 أضف الدالة دي فوق return
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await api.delete(`/cash/out/${selectedItem.id}`);

      await fetchCashOut();

      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      console.error("DELETE CASH OUT ERROR", err.response?.data || err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "عرض المنصرف",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerLeft: () => <BackButton />,
        }}
      />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ alignItems: "center" }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.background}
            />
          }
        >
          <View style={{ width: "100%", maxWidth: 640, padding: 16 }}>
            {/* ===== Filters ===== */}
            <View style={styles.filtersWrapper}>
              <View
                style={[
                  styles.filtersBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Input
                  placeholder="🔍 بحث بالاسم"
                  value={searchName}
                  onChangeText={setSearchName}
                />

                <View style={{ flexDirection: "row", gap: 8 }}>
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

                {(searchName || fromDate || toDate) && (
                  <Pressable
                    onPress={() => {
                      setSearchName("");
                      setFromDate(null);
                      setToDate(null);
                    }}
                    style={[
                      styles.clearFilterBtn,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Text style={styles.clearFilterText}>مسح الفلترة</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* ===== List ===== */}
            <View style={styles.listWrapper}>
              {filteredData.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  لا يوجد منصرفات
                </Text>
              ) : (
                filteredData.map((item) => (
                  <Card key={item.id} style={{ marginBottom: 14 }}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.label, { color: colors.muted }]}>
                        رقم الإذن
                      </Text>
                      <View style={styles.actions}>
                        <Text
                          style={styles.editBtn}
                          onPress={() =>
                            router.push({
                              pathname: "/cash/cashout",
                              params: { id: String(item.id) },
                            })
                          }
                        >
                          ✏️
                        </Text>
                        <Text
                          style={styles.deleteBtn}
                          onPress={() => {
                            setSelectedItem(item);
                            setDeleteModalOpen(true);
                          }}
                        >
                          🗑
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.value, { color: colors.text }]}>
                      {item.permission_number}
                    </Text>

                    <View style={styles.row}>
                      <Text style={[styles.label, { color: colors.muted }]}>
                        الاسم
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {item.name}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={[styles.label, { color: colors.muted }]}>
                        التاريخ
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {displayDateOnly(item.transaction_date)}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color:
                          item.entry_type === "purchase"
                            ? colors.success
                            : colors.danger,
                        fontWeight: "700",
                      }}
                    >
                      {item.entry_type === "purchase" ? "مشتريات" : "مصروفات"}
                    </Text>

                    <View
                      style={[
                        styles.amountBox,
                        {
                          backgroundColor: isDark ? "#1d347f" : "#e0e7ff",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.amount,
                          { color: isDark ? "#fee2e2" : "#1e3a8a" },
                        ]}
                      >
                        {item.amount} ج.م
                      </Text>
                    </View>

                    {item.notes && (
                      <Text style={styles.notes}>📝 {item.notes}</Text>
                    )}
                  </Card>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94a3b8", marginTop: 12 },
  title: {
    color: "#e5e7eb",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filtersWrapper: {
    marginBottom: 20, // 👈 المسافة بين البحث والكروت
  },
  filtersBox: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 10,
    color: "#e5e7eb",
  },

  listWrapper: {
    width: "100%",
  },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#020617",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  actions: { flexDirection: "row", gap: 14 },
  editBtn: { fontSize: 17, color: "#38bdf8" },
  deleteBtn: { fontSize: 17, color: "#f87171" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15, // 👈 بدل 6
  },

  label: { color: "#94a3b8", fontSize: 13 },
  value: { color: "#e5e7eb", fontWeight: "600" },
  amountBox: {
    marginTop: 15,
    backgroundColor: "#1d347f",
    padding: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  amount: { color: "#fee2e2", fontWeight: "800" },
  notes: { marginTop: 8, color: "#cbd5f5" },

  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  clearFilterBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },

  clearFilterText: {
    color: "#f87171", // أحمر هادي
    fontWeight: "700",
    fontSize: 13,
  },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtnModal: {
    flex: 1,
    backgroundColor: "#374151",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnModal: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
