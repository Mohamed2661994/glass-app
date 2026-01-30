import api from "@/services/api";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

type Invoice = {
  record_type: "invoice" | "payment";
  invoice_id: number;
  invoice_date: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
};

export default function PrintCustomerDebtDetails() {
  const { customer_name, from, to } = useLocalSearchParams<{
    customer_name: string;
    from?: string;
    to?: string;
  }>();

  const [data, setData] = useState<Invoice[]>([]);

  const fetchData = async () => {
    const res = await api.get("/reports/customer-debt-details", {
      params: { customer_name, from, to },
    });
    setData(res.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAll = data
    .filter((i) => i.record_type === "invoice")
    .reduce((s, i) => s + Number(i.total), 0);

  const totalPaid = data.reduce((s, i) => s + Number(i.paid_amount), 0);

  const totalRemaining = data
    .filter((i) => i.record_type === "invoice")
    .reduce((s, i) => s + Number(i.remaining_amount), 0);

  const netDebt = totalRemaining - totalPaid;

  useEffect(() => {
    if (Platform.OS === "web") {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.title}>كشف حساب عميل</Text>

          <View style={styles.infoRow}>
            <Text>اسم العميل: {customer_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text>
              الفترة: {from || "—"} → {to || "—"}
            </Text>
          </View>

          {/* الجدول */}
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.th}>النوع</Text>
              <Text style={styles.th}>رقم</Text>
              <Text style={styles.th}>التاريخ</Text>
              <Text style={styles.th}>الإجمالي</Text>
              <Text style={styles.th}>المدفوع</Text>
              <Text style={styles.th}>الباقي</Text>
            </View>

            {data.map((inv) => (
              <View
                key={`${inv.record_type}-${inv.invoice_id}`}
                style={styles.row}
              >
                <Text style={styles.td}>
                  {inv.record_type === "invoice" ? "فاتورة" : "سند دفع"}
                </Text>
                <Text style={styles.td}>{inv.invoice_id}</Text>
                <Text style={styles.td}>
                  {new Date(inv.invoice_date).toLocaleDateString("ar-EG")}
                </Text>
                <Text style={styles.td}>
                  {inv.record_type === "invoice" ? inv.total : "—"}
                </Text>
                <Text style={styles.td}>{inv.paid_amount}</Text>
                <Text style={styles.td}>
                  {inv.record_type === "invoice" ? inv.remaining_amount : "—"}
                </Text>
              </View>
            ))}
          </View>

          {/* الإجماليات */}
          <View style={styles.summaryBox}>
            <Text>إجمالي المدفوع: {totalPaid}</Text>
            <Text>إجمالي المتبقي: {totalRemaining}</Text>
            <Text style={styles.netDebt}>صافي المديونية: {netDebt}</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  container: {
    width: 600,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 5,
  },
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 15,
  },
  headerRow: {
    flexDirection: "row-reverse",
    backgroundColor: "#eee",
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row-reverse",
    borderTopWidth: 1,
    borderColor: "#000",
    paddingVertical: 5,
  },
  th: { flex: 1, textAlign: "center", fontWeight: "bold" },
  td: { flex: 1, textAlign: "center" },
  summaryBox: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  netDebt: {
    marginTop: 6,
    fontWeight: "bold",
    fontSize: 16,
  },
});
