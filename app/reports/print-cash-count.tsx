import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type Row = {
  id: string;
  value: number;
};

export default function PrintCashCount() {
  const { rows, counts } = useLocalSearchParams<{
    rows: string;
    counts: string;
  }>();

  const parsedRows: Row[] = rows ? JSON.parse(rows) : [];
  const parsedCounts: { [key: string]: string } = counts
    ? JSON.parse(counts)
    : {};

  const totals = useMemo(() => {
    return parsedRows.map((row) => {
      const count = Number(parsedCounts[row.id] || 0);
      return row.value * count;
    });
  }, [parsedRows, parsedCounts]);

  const grandTotal = totals.reduce((sum, t) => sum + t, 0);

  /* 🖨️ إعدادات الطباعة A5 + طباعة تلقائية */
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const style = document.createElement("style");
    style.innerHTML = `
      @page {
        size: A5 portrait;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => window.print(), 300); // 👈 يفتح نافذة الطباعة

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* ❌ إخفاء الهيدر */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.page}>
        <View style={styles.tableHeader}>
          <Text style={styles.th}>الفئة</Text>
          <Text style={styles.th}>العدد</Text>
          <Text style={styles.th}>الإجمالي</Text>
        </View>

        {parsedRows.map((row, index) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.td}>{row.value}</Text>
            <Text style={styles.td}>{parsedCounts[row.id] || 0}</Text>
            <Text style={styles.td}>{totals[index].toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>الإجمالي الكلي</Text>
          <Text style={styles.footerTotal}>{grandTotal.toLocaleString()}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 20,
    width: "100%",
    minHeight: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#000",
  },
  tableHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 2,
    borderColor: "#000",
    paddingBottom: 8,
    marginBottom: 10,
  },
  th: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
  row: {
    flexDirection: "row-reverse",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  td: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderColor: "#000",
  },
  footerText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
