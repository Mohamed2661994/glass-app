import { useTheme } from "@/components/context/theme-context";
import api from "@/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";

import {
  ActivityIndicator,
  Modal,
  Platform,
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
  const [dateInputText, setDateInputText] = useState("");
  const inputRef = useRef<any>(null);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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
    if (Platform.OS === "web" && (showFromPicker || showToPicker)) {
      setTimeout(() => {
        const el: any = inputRef.current;
        if (el) {
          el.focus();

          // select all text
          if (el.setSelectionRange) {
            el.setSelectionRange(0, el.value.length);
          }
        }
      }, 100);
    }
  }, [showFromPicker, showToPicker]);

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

  const parseDisplayDate = (text: string) => {
    const [d, m, y] = text.split("/").map(Number);
    if (!d || !m || !y) return null;
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const handleDateTextChange = (input: string) => {
    let digits = input.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;

    if (digits.length > 4)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;

    setDateInputText(formatted);

    if (formatted.length === 10) {
      const parsed = parseDisplayDate(formatted);
      if (!parsed) return;

      if (showFromPicker) {
        parsed.setHours(0, 0, 0, 0);
        setFromDate(parsed);
      } else {
        parsed.setHours(23, 59, 59, 999);
        setToDate(parsed);
      }
    }
  };

  const closeDateModal = () => {
    const parsed = parseDisplayDate(dateInputText);

    // لو المستخدم مغيرش حاجة، ناخد التاريخ الموجود أصلاً
    if (!parsed) {
      const fallback = showFromPicker
        ? fromDate || new Date()
        : toDate || new Date();

      if (showFromPicker) {
        fallback.setHours(0, 0, 0, 0);
        setFromDate(new Date(fallback));
      } else {
        fallback.setHours(23, 59, 59, 999);
        setToDate(new Date(fallback));
      }
    } else {
      if (showFromPicker) {
        parsed.setHours(0, 0, 0, 0);
        setFromDate(parsed);
      } else {
        parsed.setHours(23, 59, 59, 999);
        setToDate(parsed);
      }
    }

    setShowFromPicker(false);
    setShowToPicker(false);
    setDateInputText("");
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
        <View
          style={[
            styles.card,
            { flexDirection: "row", justifyContent: "space-between" },
          ]}
        >
          <Pressable
            style={styles.dateBtn}
            onPress={() => {
              const base = fromDate || new Date();
              setDateInputText(formatDisplayDate(base));
              setShowFromPicker(true);
            }}
          >
            <Text style={{ color: colors.text }}>
              {fromDate ? fromDate.toLocaleDateString("ar-EG") : "من تاريخ"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.dateBtn}
            onPress={() => {
              const base = toDate || new Date();
              setDateInputText(formatDisplayDate(base));
              setShowToPicker(true);
            }}
          >
            <Text style={{ color: colors.text }}>
              {toDate ? toDate.toLocaleDateString("ar-EG") : "إلى تاريخ"}
            </Text>
          </Pressable>
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

      {/* ANDROID PICKERS */}
      {Platform.OS === "android" && showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          onChange={(_, d) => {
            setShowFromPicker(false);
            if (d) setFromDate(d);
          }}
        />
      )}
      {Platform.OS === "android" && showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          onChange={(_, d) => {
            setShowToPicker(false);
            if (d) setToDate(d);
          }}
        />
      )}

      {/* IOS SPINNER */}
      {Platform.OS === "ios" && (showFromPicker || showToPicker) && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <DateTimePicker
                value={
                  showFromPicker ? fromDate || new Date() : toDate || new Date()
                }
                mode="date"
                display="spinner"
                onChange={(_, d) => {
                  if (d) showFromPicker ? setFromDate(d) : setToDate(d);
                }}
              />
              <Pressable
                style={styles.doneBtn}
                onPress={() => {
                  setShowFromPicker(false);
                  setShowToPicker(false);
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>تم</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* WEB */}
      {Platform.OS === "web" && (showFromPicker || showToPicker) && (
        <View style={styles.webOverlay}>
          <View style={styles.webModal}>
            <Text style={styles.webTitle}>
              {showFromPicker ? "اختر تاريخ البداية" : "اختر تاريخ النهاية"}
            </Text>

            <TextInput
              ref={inputRef}
              value={dateInputText}
              placeholder="dd/mm/yyyy"
              keyboardType="numeric"
              onChangeText={handleDateTextChange}
              onSubmitEditing={closeDateModal}
              onKeyPress={(e: any) => {
                if (e.nativeEvent.key === "Enter") {
                  closeDateModal();
                }
              }}
              blurOnSubmit={false}
              style={styles.webInput}
            />

            <Pressable style={styles.webConfirmBtn} onPress={closeDateModal}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>تم</Text>
            </Pressable>
          </View>
        </View>
      )}
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
