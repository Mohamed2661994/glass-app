import { useTheme } from "@/components/context/theme-context";
import DateFieldFT from "@/components/date/DateRangeField";
import BackButton from "@/components/ui/BackButton";
import api from "@/services/api";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import * as Print from "expo-print";
import { router, Stack } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ================= TYPES ================= */

type CashInItem = {
  id: number; // ✅ ضيف ده
  transaction_date: string;
  amount: number;
  paid_amount: number;
  source_type: "manual" | "invoice" | "customer_payment";

  customer_name: string; // 👈 ضيف ده
  notes?: string | null; // 👈 الحل هنا
};

type CashOutItem = {
  id: number; // ✅ ضيف ده
  transaction_date: string;
  amount: number;
  name: string; // 👈 ضيف ده
  entry_type: "expense" | "purchase"; // ✅ أضف ده
  notes?: string | null; // 👈 ضيف ده
};

/* ================= SCREEN ================= */

export default function CashSummaryScreen() {
  const { colors } = useTheme();
  const isWeb = Platform.OS === "web";

  const [cashIn, setCashIn] = useState<CashInItem[]>([]);
  const [cashOut, setCashOut] = useState<CashOutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeOpeningBalance, setIncludeOpeningBalance] = useState(true);

  // 📅 Date Filter
  const today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
    12,
  );

  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(today);

  /* ================= FETCH ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const [inRes, outRes] = await Promise.all([
          api.get("/cash-in"),
          api.get("/cash/out", { params: { branch_id: 1 } }),
        ]);

        const mappedCashIn = (inRes.data.data || []).map((item: any) => ({
          ...item,
          notes: item.notes ?? item.description ?? null,
        }));

        setCashIn(mappedCashIn); // ✅ بس دي

        // setCashIn(inRes.data.data || []);
        setCashOut(outRes.data.data || []);
      } catch (err: any) {
        console.log("SUMMARY FETCH ERROR", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ================= HELPERS ================= */

  const inRange = (dateStr: string) => {
    const itemTime = toDateOnly(new Date(dateStr));

    const fromTime = fromDate ? toDateOnly(fromDate) : null;
    const toTime = toDate ? toDateOnly(toDate) : null;

    if (fromTime && itemTime < fromTime) return false;
    if (toTime && itemTime > toTime) return false;

    return true;
  };
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const formatCardDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toDateOnly = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const getPreviousDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  const previousDate = getPreviousDay(fromDate);

  const prevCashIn = cashIn.filter(
    (i) =>
      toDateOnly(new Date(i.transaction_date)) === toDateOnly(previousDate),
  );

  const prevCashOut = cashOut.filter(
    (o) =>
      toDateOnly(new Date(o.transaction_date)) === toDateOnly(previousDate),
  );

  /* ================= FILTERED DATA ================= */

  const filteredCashIn = useMemo(
    () => cashIn.filter((i) => inRange(i.transaction_date)),
    [cashIn, fromDate, toDate],
  );

  const filteredCashOut = useMemo(
    () => cashOut.filter((o) => inRange(o.transaction_date)),
    [cashOut, fromDate, toDate],
  );

  /* ================= CALC ================= */

  const prevSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    prevCashIn.forEach((i) => {
      totalIn +=
        i.source_type === "invoice" ? Number(i.paid_amount) : Number(i.amount);
    });

    prevCashOut.forEach((o) => {
      totalOut += Number(o.amount);
    });

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }, [prevCashIn, prevCashOut]);
  const openingBalance = useMemo(
    () => (includeOpeningBalance ? prevSummary.balance : 0),
    [includeOpeningBalance, prevSummary.balance],
  );

  const summary = useMemo(() => {
    let totalIn = openingBalance;

    let totalOut = 0;

    filteredCashIn.forEach((i) => {
      totalIn +=
        i.source_type === "invoice" ? Number(i.paid_amount) : Number(i.amount);
    });

    filteredCashOut.forEach((o) => {
      totalOut += Number(o.amount);
    });

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }, [filteredCashIn, filteredCashOut, openingBalance]);
  const expenseOut = filteredCashOut.filter((o) => o.entry_type === "expense");

  const purchaseOut = filteredCashOut.filter(
    (o) => o.entry_type === "purchase",
  );

  const buildPrintHTML = () => {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      margin: 0;
      padding: 20px;
      color: #000;
    }

    h1 {
      text-align: center;
      margin-bottom: 16px;
    }

    .summary-box {
      border: 1px solid #000;
      padding: 12px;
      margin-bottom: 20px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 14px;
    }

    .bold {
      font-weight: bold;
    }

    .tables {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .table-box {
      flex: 1;
    }

    .table-title {
      font-weight: bold;
      margin-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      border: 1px solid #000;
      padding: 6px;
      font-size: 12px;
      text-align: right;
    }

    th {
      background: #eee;
    }
  </style>
</head>

<body>

  <h1>اليومية</h1>

  <!-- SUMMARY -->
  <div class="summary-box">
    ${
      includeOpeningBalance
        ? `<div class="summary-row">
            <span>رصيد افتتاحي</span>
            <span>${Math.round(openingBalance).toLocaleString("ar-EG")}</span>
          </div>`
        : ""
    }

    <div class="summary-row">
      <span>إجمالي الوارد</span>
      <span>${Math.round(summary.totalIn).toLocaleString("ar-EG")}</span>
    </div>

    <div class="summary-row">
      <span>إجمالي المنصرف</span>
      <span>${Math.round(summary.totalOut).toLocaleString("ar-EG")}</span>
    </div>

    <div class="summary-row bold">
      <span>الرصيد</span>
      <span>${Math.round(summary.balance).toLocaleString("ar-EG")}</span>
    </div>
  </div>

  <!-- TABLES -->
  <div class="tables">

    <!-- الوارد -->
    <div class="table-box">
      <div class="table-title">الوارد</div>
      <table>
        <tr>
          <th>الاسم</th>
          <th>المبلغ</th>
          <th>ملاحظات</th>
        </tr>
        ${filteredCashIn
          .map(
            (i) => `
          <tr>
            <td>${i.customer_name}</td>
            <td>${Math.round(
              i.source_type === "invoice" ? i.paid_amount : i.amount,
            ).toLocaleString("ar-EG")}</td>
            <td>${i.notes || "-"}</td>
          </tr>`,
          )
          .join("")}
      </table>
    </div>

   <!-- المنصرف (مصروفات) -->
<div class="table-box">
  <div class="table-title">المنصرف (مصروفات)</div>
  <table>
    <tr>
      <th>الاسم</th>
      <th>المبلغ</th>
      <th>ملاحظات</th>
    </tr>
    ${expenseOut
      .map(
        (o) => `
      <tr>
        <td>${o.name}</td>
        <td>${Math.round(o.amount).toLocaleString("ar-EG")}</td>
        <td>${o.notes || "-"}</td>
      </tr>`,
      )
      .join("")}
  </table>
</div>

${
  purchaseOut.length > 0
    ? `
<!-- المنصرف (مشتريات) -->
<div class="table-box">
  <div class="table-title">المنصرف (مشتريات)</div>
  <table>
    <tr>
      <th>الاسم</th>
      <th>المبلغ</th>
      <th>ملاحظات</th>
    </tr>
    ${purchaseOut
      .map(
        (o) => `
      <tr>
        <td>${o.name}</td>
        <td>${Math.round(o.amount).toLocaleString("ar-EG")}</td>
        <td>${o.notes || "-"}</td>
      </tr>`,
      )
      .join("")}
  </table>
</div>
`
    : ""
}


  </div>

</body>
</html>
`;
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "ملخص الخزنة",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerLeft: () => <BackButton />,
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: "center" }}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.container}>
          {/* ===== Print ===== */}
          <Pressable
            onPress={async () => {
              if (Platform.OS === "web") {
                router.push({
                  pathname: "/cash/summary-print",
                  params: {
                    from: fromDate.toISOString(),
                    to: toDate.toISOString(),
                    includeOpeningBalance: includeOpeningBalance ? "1" : "0",
                  },
                });
                return;
              }

              try {
                const html = buildPrintHTML();
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, {
                  mimeType: "application/pdf",
                  dialogTitle: "تقرير الخزنة",
                  UTI: "com.adobe.pdf",
                });
              } catch (err) {
                console.log("PRINT ERROR", err);
                alert("حصلت مشكلة أثناء إنشاء ملف PDF");
              }
            }}
            style={[styles.printBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>🖨️ طباعة</Text>
          </Pressable>

          {/* ===== Date Filters ===== */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: "row", gap: 10 }}>
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

          {/* ===== Opening Balance Toggle ===== */}
          <Pressable
            onPress={() => setIncludeOpeningBalance((v) => !v)}
            style={[styles.card, { backgroundColor: colors.card, gap: 6 }]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                احتساب رصيد اليومية السابقة
              </Text>
              <Text style={{ fontSize: 18 }}>
                {includeOpeningBalance ? "☑️" : "⬜"}
              </Text>
            </View>

            {!includeOpeningBalance && (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                عند الإلغاء سيتم تجاهل رصيد اليوم السابق من الحساب
              </Text>
            )}
          </Pressable>

          {/* ===== SUMMARY ===== */}
          <View
            style={[
              styles.summaryWrapper,
              isWeb && { flexDirection: "row", flexWrap: "wrap" },
            ]}
          >
            {includeOpeningBalance && (
              <View
                style={[styles.summaryCard, { backgroundColor: colors.card }]}
              >
                <Text style={styles.label}>
                  اليومية السابقة ({formatLocalDate(previousDate)})
                </Text>

                <Text
                  style={{
                    color: colors.success,
                    fontWeight: "700",
                    marginTop: 6,
                  }}
                >
                  الوارد: {prevSummary.totalIn} ج.م
                </Text>

                <Text style={{ color: colors.danger, fontWeight: "700" }}>
                  المنصرف: {prevSummary.totalOut} ج.م
                </Text>

                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: "900",
                    fontSize: 16,
                    color:
                      prevSummary.balance >= 0 ? colors.success : colors.danger,
                  }}
                >
                  الرصيد: {prevSummary.balance} ج.م
                </Text>
              </View>
            )}

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card },
                isWeb && { flex: 1 },
              ]}
            >
              <Text style={styles.label}>إجمالي المنصرف</Text>
              <Text style={styles.out}>{summary.totalOut} ج.م</Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card },
                isWeb && { flex: 1 },
              ]}
            >
              <Text style={styles.label}>إجمالي الوارد</Text>
              <Text style={styles.in}>{summary.totalIn} ج.م</Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card },
                isWeb && { width: "100%" },
              ]}
            >
              <Text style={styles.label}>رصيد الخزنة</Text>
              <Text
                style={[
                  styles.balance,
                  {
                    color:
                      summary.balance >= 0 ? colors.success : colors.danger,
                  },
                ]}
              >
                {summary.balance} ج.م
              </Text>
            </View>
          </View>

          {/* ===== LISTS ===== */}
          <View
            style={[
              styles.listsWrapper,
              isWeb && { flexDirection: "row", gap: 16 },
            ]}
          >
            {/* المنصرف */}
            <View style={[styles.listBox, { backgroundColor: colors.card }]}>
              <Text style={styles.listTitle}>المنصرف</Text>

              {filteredCashOut.map((o) => (
                <View key={o.id} style={styles.itemRow}>
                  {/* 🗓 التاريخ */}
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={[styles.cardDate, { color: colors.muted }]}>
                      {formatCardDate(o.transaction_date)}
                    </Text>
                  </View>

                  <View style={styles.topRow}>
                    <Text style={[styles.name, { color: colors.text }]}>
                      {o.name}
                    </Text>

                    <Text style={styles.amountOut}>{o.amount}</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            o.entry_type === "purchase" ? "#14532d" : "#7c2d12",
                        },
                      ]}
                    >
                      <Text style={styles.typeText}>
                        {o.entry_type === "purchase" ? "مشتريات" : "مصروفات"}
                      </Text>
                    </View>
                  </View>

                  {o.notes && <Text style={styles.notes}>📝 {o.notes}</Text>}
                </View>
              ))}
            </View>
            {/* الوارد */}
            <View style={[styles.listBox, { backgroundColor: colors.card }]}>
              <Text style={styles.listTitle}>الوارد</Text>

              {filteredCashIn.map((i) => (
                <View key={i.id} style={styles.itemRow}>
                  {/* 🗓 التاريخ */}
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colors.muted}
                    />
                    <Text style={[styles.cardDate, { color: colors.muted }]}>
                      {formatCardDate(i.transaction_date)}
                    </Text>
                  </View>

                  <View style={styles.topRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={[styles.name, { color: colors.text }]}>
                        {i.customer_name}
                      </Text>
                    </View>

                    <Text style={styles.amountIn}>
                      {i.source_type === "invoice" ? i.paid_amount : i.amount}
                    </Text>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            i.source_type === "invoice"
                              ? "#7c3aed"
                              : i.source_type === "customer_payment"
                                ? "#14532d"
                                : "#1e3a8a",
                        },
                      ]}
                    >
                      <Text style={styles.typeText}>
                        {i.source_type === "invoice"
                          ? "فاتورة"
                          : i.source_type === "customer_payment"
                            ? "سداد عميل"
                            : "وارد يدوي"}
                      </Text>
                    </View>
                  </View>

                  {i.notes && <Text style={styles.notes}>📝 {i.notes}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { width: "100%", maxWidth: 900, padding: 16, gap: 14 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  label: { color: "#94a3b8", fontSize: 14 },
  in: { color: "#22c55e", fontSize: 22, fontWeight: "800" },
  out: { color: "#ef4444", fontSize: 22, fontWeight: "800" },
  balance: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  inputBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryWrapper: { gap: 14 },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  listsWrapper: { marginTop: 20, gap: 14 },
  listBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  cardDate: {
    fontSize: 12,
  },

  typeBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  typeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  listTitle: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  itemRow: {
    borderTopWidth: 1,
    borderColor: "#334155",
    paddingTop: 8,
    marginTop: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxWidth: 320,
    padding: 20,
    borderRadius: 16,
    gap: 14,
  },
  printBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  btn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  webInput: {
    width: "93%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#020617",
    color: "#fff",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  name: {
    flex: 2,
    fontWeight: "700",
    fontSize: 14,
  },

  amountOut: {
    flex: 1,
    color: "#ef4444",
    fontWeight: "800",
    textAlign: "center",
  },

  amountIn: {
    flex: 1,
    color: "#22c55e",
    fontWeight: "800",
    textAlign: "center",
  },

  dateBox: {
    flex: 1,
    alignItems: "flex-end",
  },

  dateText: {
    color: "#94a3b8",
    fontSize: 12,
  },

  notes: {
    marginTop: 8,
    color: "#0736cf",
    fontSize: 13,
    lineHeight: 18,
  },
});
