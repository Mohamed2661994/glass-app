import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Row = {
  id: string;
  value: number;
};

const STORAGE_KEY = "cash_count_data";

export default function CashCountForm() {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", value: 200 },
    { id: "2", value: 100 },
    { id: "3", value: 50 },
    { id: "4", value: 20 },
    { id: "5", value: 10 },
    { id: "6", value: 5 },
    { id: "7", value: 1 },
  ]);

  const [counts, setCounts] = useState<{ [key: string]: string }>({});
  const [editMode, setEditMode] = useState(false);
  const [newDenom, setNewDenom] = useState("");

  const inputRefs = useRef<Array<TextInput | null>>([]);

  /* ================= LOAD SAVED DATA ================= */
  useEffect(() => {
    // مهلة بسيطة عشان المودال يرسم
    const t = setTimeout(() => {
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();

        // select all text (يشتغل على الويب)
        if (Platform.OS === "web") {
          const el = firstInput as any;
          if (el.setSelectionRange) {
            el.setSelectionRange(0, el.value?.length || 0);
          }
        }
      }
    }, 150);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRows(parsed.rows || []);
        setCounts(parsed.counts || {});
      }
    };
    load();
  }, []);

  /* ================= SAVE DATA WHEN CHANGED ================= */
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, counts }));
  }, [rows, counts]);

  /* ================= CALCULATIONS ================= */
  const totals = useMemo(() => {
    return rows.map((row) => {
      const count = Number(counts[row.id] || 0);
      return row.value * count;
    });
  }, [counts, rows]);

  const grandTotal = totals.reduce((sum, t) => sum + t, 0);

  /* ================= ACTIONS ================= */

  const clearAll = async () => {
    setCounts({});
    await AsyncStorage.removeItem(STORAGE_KEY); // يمسح الحفظ
  };

  const addDenomination = () => {
    const val = Number(newDenom);
    if (!val) return;

    setRows((prev) => [...prev, { id: Date.now().toString(), value: val }]);
    setNewDenom("");
  };

  const removeDenomination = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setCounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>عدّ النقدية</Text>

      <View style={styles.topButtons}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.actionText}>
            {editMode ? "إنهاء التعديل" : "تعديل الفئات"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.clearBtn]}
          onPress={clearAll}
        >
          <Text style={[styles.actionText, { color: "#fff" }]}>مسح القيم</Text>
        </Pressable>
      </View>

      {editMode && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="فئة جديدة"
            keyboardType="numeric"
            value={newDenom}
            onChangeText={(t) => setNewDenom(t.replace(/[^0-9]/g, ""))}
          />
          <Pressable style={styles.addBtn} onPress={addDenomination}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>إضافة</Text>
          </Pressable>
        </View>
      )}

      <ScrollView>
        {rows.map((row, index) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.denom}>{row.value}</Text>

            <TextInput
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={styles.input}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              value={counts[row.id] || ""}
              onChangeText={(text) =>
                setCounts((prev) => ({
                  ...prev,
                  [row.id]: text.replace(/[^0-9]/g, ""),
                }))
              }
              onSubmitEditing={() => {
                if (index < rows.length - 1) {
                  const nextInput = inputRefs.current[index + 1];

                  if (nextInput) {
                    nextInput.focus();

                    // Select All (خصوصًا للويب)
                    if (Platform.OS === "web") {
                      const el = nextInput as any;
                      setTimeout(() => {
                        if (el.setSelectionRange) {
                          el.setSelectionRange(0, el.value?.length || 0);
                        }
                      }, 50);
                    }
                  }
                }
              }}
              placeholder="0"
            />

            {editMode && (
              <Pressable
                style={styles.deleteBtn}
                onPress={() => removeDenomination(row.id)}
              >
                <Text style={{ color: "#fff" }}>🗑</Text>
              </Pressable>
            )}

            <Text style={styles.total}>
              {(row.value * Number(counts[row.id] || 0)).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>الإجمالي الكلي</Text>
        <Text style={styles.footerTotal}>{grandTotal.toLocaleString()}</Text>
      </View>
      <Pressable
        style={styles.printBtn}
        onPress={() =>
          router.push({
            pathname: "/reports/print-cash-count" as any,
            params: {
              rows: JSON.stringify(rows),
              counts: JSON.stringify(counts),
            },
          })
        }
      >
        <Text style={styles.printText}>🖨️ طباعة الكشف</Text>
      </Pressable>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { backgroundColor: "#ffffff", padding: 20, borderRadius: 16 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#0f172a",
  },
  topButtons: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  clearBtn: { backgroundColor: "#dc2626" },
  actionText: { fontWeight: "bold", color: "#0f172a" },
  addRow: { flexDirection: "row-reverse", marginBottom: 12, gap: 10 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  row: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 10 },
  denom: {
    width: 60,
    fontWeight: "bold",
    fontSize: 16,
    color: "#0f172a",
    textAlign: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    marginHorizontal: 8,
    backgroundColor: "#f8fafc",
  },
  printBtn: {
    marginTop: 14,
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  printText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  deleteBtn: {
    backgroundColor: "#ef4444",
    padding: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  total: {
    width: 100,
    textAlign: "center",
    fontWeight: "bold",
    color: "#16a34a",
  },
  footer: {
    borderTopWidth: 2,
    borderColor: "#e2e8f0",
    marginTop: 16,
    paddingTop: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  footerTotal: { fontSize: 18, fontWeight: "bold", color: "#dc2626" },
});
