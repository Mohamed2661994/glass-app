import api from "@/services/api";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

/* ================= TYPES ================= */

type CashInItem = {
  id: number;
  transaction_date: string;
  amount: number;
  paid_amount: number;
  source_type: "manual" | "invoice";
  customer_name: string;
  notes?: string | null;
};

type CashOutItem = {
  id: number;
  transaction_date: string;
  amount: number;
  name: string;
  entry_type: "expense" | "purchase";
  notes?: string | null;
};

/* ================= SCREEN ================= */

export default function CashSummaryPrint() {
  const { from, to, includeOpeningBalance } = useLocalSearchParams<{
    from: string;
    to: string;
    includeOpeningBalance?: string;
  }>();

  const showOpeningBalance = includeOpeningBalance === "1";

  const [cashIn, setCashIn] = useState<CashInItem[]>([]);
  const [cashOut, setCashOut] = useState<CashOutItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  /* ================= FETCH ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const [inRes, outRes] = await Promise.all([
          api.get("/cash-in"),
          api.get("/cash/out", { params: { branch_id: 1 } }),
        ]);

        setCashIn(inRes.data.data || []);
        setCashOut(outRes.data.data || []);
      } catch (err: any) {
        console.error(
          "CASH SUMMARY LOAD ERROR",
          err.response?.data || err.message,
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ===== Print setup ===== */
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;
    // إجبار Light Mode بالكامل
    document.documentElement.setAttribute("data-force-light", "true");
    const style = document.createElement("style");
    style.innerHTML = `
    @page {
      size: A4;
      margin: 20mm;
    }

    @media print {
      html, body {
        width: 100%;
        height: auto !important;
        margin: 0;
        padding: 0;
        background: #fff !important;
        overflow: visible !important;
      }

      .avoidBreak {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;

    document.head.appendChild(style);

    return () => {
      document.documentElement.removeAttribute("data-force-light");
      document.head.removeChild(style);
    };
  }, []);
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const html = document.documentElement;
    const body = document.body;

    // كسر أي Dark Mode
    html.style.backgroundColor = "#fff";
    body.style.backgroundColor = "#fff";
    html.style.colorScheme = "light";
    body.style.colorScheme = "light";

    html.style.minHeight = "100vh";
    body.style.minHeight = "100vh";

    return () => {
      html.style.backgroundColor = "";
      body.style.backgroundColor = "";
      html.style.colorScheme = "";
      body.style.colorScheme = "";
    };
  }, []);

  /* ================= HELPERS ================= */
  const toDateOnly = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const inRange = (dateStr: string) => {
    const t = toDateOnly(new Date(dateStr));
    if (fromDate && t < toDateOnly(fromDate)) return false;
    if (toDate && t > toDateOnly(toDate)) return false;
    return true;
  };

  const formatMoney = (n: number) => Math.round(n).toLocaleString("ar-EG");

  const getPreviousDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);

  const previousDate = fromDate ? getPreviousDay(fromDate) : null;

  /* ================= FILTER ================= */
  const filteredIn = cashIn.filter((i) => inRange(i.transaction_date));
  const filteredOut = cashOut.filter((o) => inRange(o.transaction_date));

  const expenses = filteredOut.filter((o) => o.entry_type === "expense");
  const purchases = filteredOut.filter((o) => o.entry_type === "purchase");

  const prevCashIn = previousDate
    ? cashIn.filter(
        (i) =>
          toDateOnly(new Date(i.transaction_date)) === toDateOnly(previousDate),
      )
    : [];

  const prevCashOut = previousDate
    ? cashOut.filter(
        (o) =>
          toDateOnly(new Date(o.transaction_date)) === toDateOnly(previousDate),
      )
    : [];

  const prevSummary = useMemo(() => {
    const totalIn = prevCashIn.reduce((s, i) => {
      const val =
        i.source_type === "invoice" ? Number(i.paid_amount) : Number(i.amount);
      return s + (isNaN(val) ? 0 : val);
    }, 0);

    const totalOut = prevCashOut.reduce((s, o) => {
      const val = Number(o.amount);
      return s + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      balance: totalIn - totalOut,
    };
  }, [prevCashIn, prevCashOut]);

  const openingBalance = showOpeningBalance ? prevSummary.balance : 0;

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const totalIn =
      openingBalance +
      filteredIn.reduce((s, i) => {
        const val =
          i.source_type === "invoice"
            ? Number(i.paid_amount)
            : Number(i.amount);
        return s + (isNaN(val) ? 0 : val);
      }, 0);

    const totalOut = filteredOut.reduce((s, o) => {
      const val = Number(o.amount);
      return s + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }, [filteredIn, filteredOut, openingBalance]);

  /* ================= TABLE ================= */
  const Table = ({ title, rows }: { title: string; rows: any[][] }) => (
    <View style={styles.tableBox}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.notes]}>ملاحظات</Text>
          <Text style={[styles.cell, styles.amount]}>المبلغ</Text>
          <Text style={[styles.cell, styles.name]}>الاسم</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cell, styles.notes]}>{r[0] || "-"}</Text>
            <Text style={[styles.cell, styles.amount]}>
              {formatMoney(r[1])}
            </Text>
            <Text style={[styles.cell, styles.name]}>{r[2]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  const hasPurchases = purchases.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.page}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <Text style={styles.title}>اليومية</Text>
          {/* ================= SUMMARY ================= */}
          <View style={styles.summaryBox}>
            {previousDate && showOpeningBalance && (
              <>
                <Row
                  label={`رصيد افتتاحي (${previousDate.toLocaleDateString(
                    "ar-EG",
                  )})`}
                  value={openingBalance}
                />

                <View style={styles.divider} />
              </>
            )}

            <Row label="إجمالي الوارد" value={summary.totalIn} />
            <Row label="إجمالي المنصرف" value={summary.totalOut} />
            <Row label="الرصيد" value={summary.balance} />
          </View>

          {/* CASH IN */}
          {/* ROW TABLES */}
          <View style={styles.rowTables}>
            {/* المصروفات */}
            <Table
              title="المنصرف (مصروفات)"
              rows={expenses.map((o) => [o.notes, o.amount, o.name])}
            />
            {/* المشتريات (شرطية) */}
            {hasPurchases && (
              <Table
                title="المنصرف (مشتريات)"
                rows={purchases.map((o) => [o.notes, o.amount, o.name])}
              />
            )}
            {/* الوارد */}
            <Table
              title="الوارد"
              rows={filteredIn.map((i) => [
                i.notes,
                i.source_type === "invoice" ? i.paid_amount : i.amount,
                i.customer_name,
              ])}
            />
          </View>
        </View>
      </View>
    </>
  );
}

/* ================= SUMMARY ROW ================= */
type RowProps = {
  label: string;
  value: number;
};

const Row = ({ label, value }: RowProps) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryValue}>
      {Math.round(value).toLocaleString("ar-EG")}
    </Text>

    <Text style={styles.summaryLabel}>{label}:</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    direction: "rtl",
    flex: 1,
  },

  tableBox: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  summaryLabel: {
    fontSize: 13,
    textAlign: "right",
    color: "#000",
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 12,
    marginVertical: 20,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "left",
  },

  rowTables: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap", // 👈 مهم لو جدولين بس
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 6,
  },

  table: {
    borderWidth: 1,
    borderColor: "#000",
  },
  sheet: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 20,
    width: 800,
    maxWidth: "100%",
    marginHorizontal: "auto",
    backgroundColor: "#fff",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 1,
    borderColor: "#000",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },

  cell: {
    padding: 6,
    fontSize: 12,
  },

  notes: { flex: 3 },
  amount: { flex: 1, textAlign: "center" },
  name: { flex: 2 },
});
