import { Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/* ================= MAIN ================= */

export default function StockTransferPrint() {
  const params = useLocalSearchParams();

  const payload = params.data
    ? JSON.parse(params.data as string)
    : { transfer_number: "-", items: [], total_amount: 0 };

  const { transfer_number, items, total_amount } = payload;

  return (
    <>
      <Stack.Screen
        options={{
          title: "طباعة التحويل",
          headerTitleAlign: "center",
          headerShown: false, // 👈 يشيل الجزء اللي فوق كله
        }}
      />
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== A4 PAPER ===== */}
        <View style={styles.paper}>
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            <Text style={styles.title}>فاتورة تحويل مخازن</Text>
            <Text style={styles.sub}>رقم التحويل: {transfer_number}</Text>
          </View>

          {/* ===== TABLE HEADER ===== */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colIndex]}>م</Text>
            <Text style={[styles.cell, styles.colName]}>اسم الصنف</Text>
            <Text style={[styles.cell, styles.colQty]}>من المخزن</Text>
            <Text style={[styles.cell, styles.colQty]}>الي المعرض</Text>
            <Text style={[styles.cell, styles.colTotal]}>الإجمالي</Text>
          </View>

          {/* ===== TABLE ROWS ===== */}
          {items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colIndex]}>{index + 1}</Text>

              <Text style={styles.colName}>
                {item.product_name} - {item.manufacturer}
                {"\n"}
              </Text>

              <Text style={[styles.cell, styles.colQty]}>
                {item.from_quantity}
              </Text>

              <Text style={[styles.cell, styles.colQty]}>
                {item.to_quantity}
              </Text>

              <Text style={[styles.cell, styles.colTotal]}>
                {Math.round(item.final_price)}
              </Text>
            </View>
          ))}

          {/* ===== TOTAL ===== */}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>
              الإجمالي: {Math.round(total_amount)} جنيه
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#e5e7eb",
    //justifyContent: "center", // 👈 ده المهم
    alignItems: "center",
  },
  paper: {
    width: "100%",
    maxWidth: 794, // ≈ A4
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 6,
    marginVertical: 20, // 👈 مسافة مريحة
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  sub: {
    fontSize: 13,
    marginTop: 4,
  },

  tableHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 2,
    borderColor: "#000",
    paddingVertical: 6,
  },

  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
  },

  cell: {
    fontSize: 12,
    textAlign: "center",
  },

  colIndex: {
    width: "6%",
  },

  colName: {
    width: "38%",
    textAlign: "right",
    writingDirection: "rtl", // 👈 مهم
  },

  colQty: {
    width: "16%",
  },

  colTotal: {
    width: "24%",
    fontWeight: "700",
  },

  totalRow: {
    marginTop: 14,
    borderTopWidth: 2,
    borderColor: "#000",
    paddingTop: 8,
    paddingLeft: 10,
    alignItems: "flex-start", // 👈 يخلي المحتوى على الشمال
  },

  totalText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "left",
  },
});
