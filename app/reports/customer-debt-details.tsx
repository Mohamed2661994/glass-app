import { useTheme } from "@/components/context/theme-context";
import DateFieldFT from "@/components/date/DateRangeField";
import api from "@/services/api";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Invoice = {
  record_type: "invoice" | "payment";
  invoice_id: number;
  invoice_date: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
};

export default function CustomerDebtDetails() {
  const { colors } = useTheme();
  const { customer_name } = useLocalSearchParams<{ customer_name: string }>();
  const styles = createStyles(colors);

  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<any>(null);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const formatDateForAPI = (date: Date) => date.toLocaleDateString("en-CA"); // YYYY-MM-DD بدون UTC

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/customer-debt-details", {
        params: {
          customer_name,
          from: fromDate ? formatDateForAPI(fromDate) : undefined,
          to: toDate ? formatDateForAPI(toDate) : undefined,
        },
      });
      setData(res.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [fromDate, toDate]);

  const totalAll = data
    .filter((i) => i.record_type === "invoice")
    .reduce((s, i) => s + Number(i.total), 0);

  const totalPaid = data.reduce((s, i) => s + Number(i.paid_amount), 0);

  const totalRemaining = data
    .filter((i) => i.record_type === "invoice")
    .reduce((s, i) => s + Number(i.remaining_amount), 0);
  const netDebt = totalRemaining - totalPaid;

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "كشف حساب العميل", headerTitleAlign: "center" }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16 }}
      >
        {Platform.OS === "web" && (
          <Pressable
            style={styles.printBtn}
            onPress={() =>
              router.push({
                pathname: "/reports/print-customer-debt-details",
                params: {
                  customer_name,
                  from: fromDate ? formatDateForAPI(fromDate) : "",
                  to: toDate ? formatDateForAPI(toDate) : "",
                },
              })
            }
          >
            <Text style={styles.printText}>🖨️ طباعة التقرير</Text>
          </Pressable>
        )}

        {/* اسم العميل */}
        <View style={styles.card}>
          <Text style={styles.label}>اسم العميل</Text>
          <Text style={styles.customerName}>{customer_name}</Text>
        </View>

        {/* فلترة التاريخ */}
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

        {/* جدول */}
        <View style={[styles.card, { padding: 0 }]}>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>النوع</Text>
            <Text style={styles.th}>رقم</Text>
            <Text style={styles.th}>التاريخ</Text>
            <Text style={styles.th}>الإجمالي</Text>
            <Text style={styles.th}>المدفوع</Text>
            <Text style={styles.th}>الباقي</Text>
          </View>

          {loading && <ActivityIndicator style={{ margin: 20 }} />}

          {!loading &&
            data.map((inv) => (
              <View
                key={`${inv.record_type}-${inv.invoice_id}`}
                style={styles.row}
              >
                <Text style={[styles.td, { color: colors.text }]}>
                  {inv.record_type === "invoice" ? "فاتورة" : "سند دفع"}
                </Text>

                <Text style={[styles.td, { color: colors.text }]}>
                  {inv.invoice_id}
                </Text>

                <Text style={[styles.td, { color: colors.text }]}>
                  {new Date(inv.invoice_date).toLocaleDateString("ar-EG")}
                </Text>

                <Text style={[styles.td, { color: colors.text }]}>
                  {inv.record_type === "invoice" ? inv.total : "—"}
                </Text>

                <Text style={[styles.td, { color: "#22c55e" }]}>
                  {inv.paid_amount}
                </Text>

                <Text style={[styles.td, { color: "#ef4444" }]}>
                  {inv.record_type === "invoice" ? inv.remaining_amount : "—"}
                </Text>
              </View>
            ))}
        </View>
        {/* صف الإجمالي */}
        {!loading && data.length > 0 && (
          <View style={[styles.row, { backgroundColor: "#0f172a" }]}>
            <Text style={[styles.td, { fontWeight: "bold", color: "#fff" }]}>
              الإجمالي
            </Text>

            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>

            <Text style={[styles.td, { fontWeight: "bold", color: "#fff" }]}>
              {totalAll}
            </Text>

            <Text style={[styles.td, { fontWeight: "bold", color: "#22c55e" }]}>
              {totalPaid}
            </Text>

            <Text style={[styles.td, { fontWeight: "bold", color: "#ef4444" }]}>
              {totalRemaining}
            </Text>
          </View>
        )}
        {/* صف صافي المديونية */}
        {!loading && data.length > 0 && (
          <View style={[styles.row, { backgroundColor: "#12407c" }]}>
            <Text style={[styles.td, { fontWeight: "bold", color: "#fff" }]}>
              صافي المديونية
            </Text>

            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>
            <Text style={styles.td}></Text>

            <Text
              style={[
                styles.td,
                {
                  fontWeight: "bold",
                  color: netDebt > 0 ? "#fbff00" : "#22c55e",
                  fontSize: 15,
                },
              ]}
            >
              {netDebt}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.muted,
      marginBottom: 4,
      textAlign: "right",
    },
    customerName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "right",
    },
    dateBtn: {
      backgroundColor: colors.input,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      width: "48%",
      alignItems: "center",
    },
    webModal: {
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 16,
      width: 320,
      alignItems: "center",
    },
    printBtn: {
      alignSelf: "center",
      backgroundColor: "#0f172a",
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 10,
    },
    printText: {
      color: "#fff",
      fontWeight: "bold",
    },

    webTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 12 },

    webInputWrapper: {
      flexDirection: "row-reverse",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
      width: "100%",
      height: 45,
    },
    dateFilterBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },

    dateRow: {
      flexDirection: "row",
      gap: 10,
    },

    webInput: {
      width: "100%",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#cbd5e1",
      textAlign: "center",
      marginBottom: 10,
    },

    webConfirmBtn: {
      backgroundColor: "#2563eb",
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 10,
    },

    tableHeader: {
      flexDirection: "row-reverse",
      backgroundColor: "#1e293b",
      padding: 10,
    },
    th: { flex: 1, color: "#fff", fontWeight: "bold", textAlign: "center" },
    row: {
      flexDirection: "row-reverse",
      padding: 10,
      borderBottomWidth: 1,
      borderColor: "#eee",
    },
    td: { flex: 1, textAlign: "center" },
    modalBg: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
    },
    doneBtn: {
      backgroundColor: "#2563eb",
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
    },
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
  });
