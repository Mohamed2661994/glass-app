import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

type CustomerRow = {
  customer_name: string;
  balance_due: number;
  total_paid: number;
  discount_diff?: number;
  last_invoice_date?: string | null;
};

export default function PrintSelectedCustomers() {
  const { customers } = useLocalSearchParams();
  const selected: CustomerRow[] = customers
    ? JSON.parse(customers as string)
    : [];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <Text style={styles.title}>تقرير مديونية العملاء المختارين</Text>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}></Text>
        <Text style={styles.headerCell}></Text>
        <Text style={styles.headerCell}>اسم العميل</Text>
        <Text style={styles.headerCell}>التاريخ</Text>
        <Text style={styles.headerCell}>المديونية</Text>
        <Text style={styles.headerCell}>فرق خصم</Text>
        <Text style={styles.headerCell}>المدفوع</Text>
        <Text style={styles.headerCell}>المتبقي</Text>
      </View>

      <FlatList
        data={selected}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}></Text>
            <Text style={styles.cell}></Text>
            <Text style={styles.cell}>{item.customer_name}</Text>
            <Text style={styles.cell}>
              {item.last_invoice_date
                ? new Date(item.last_invoice_date).toLocaleDateString("en-US")
                : "-"}
            </Text>
            <Text style={styles.cell}>
              {Number(item.balance_due).toLocaleString()}
            </Text>
            <Text style={styles.cell}></Text>
            <Text style={styles.cell}></Text>
            <Text style={styles.cell}></Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  headerRow: {
    flexDirection: "row-reverse",
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#eee",
  },
  row: {
    flexDirection: "row-reverse",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
  },

  headerCell: {
    flex: 1,
    padding: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderLeftWidth: 1,
    borderColor: "#000",
  },
  cell: {
    flex: 1,
    padding: 8,
    textAlign: "center",
    borderLeftWidth: 1,
    borderColor: "#000",
    fontSize: 12,
  },
});
