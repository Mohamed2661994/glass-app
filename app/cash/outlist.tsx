import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef } from "react";
import { Modal, TextInput } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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
  const normalizeDate = (date: Date) =>
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      // 👈 نفس منطق السيرفر
    );

  // 🔍 Filters
  const [searchName, setSearchName] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const dateInputRef = useRef<TextInput>(null);
  const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);

  const [dateInputText, setDateInputText] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // 📅 Date Modal
  const [activeDateType, setActiveDateType] = useState<"from" | "to" | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [webTempDate, setWebTempDate] = useState<string>("");

  // 🗑 Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashOutItem | null>(null);

  const fetchCashOut = async () => {
    try {
      const { data } = await api.get("/cash/out", {
        params: { branch_id: 1 },
      });

      setData(data.data || []);
    } catch (err: any) {
      console.error("FETCH CASH OUT ERROR", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const parseDisplayDate = (text: string) => {
    const parts = text.split("/");
    if (parts.length !== 3) return null;

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (!day || !month || !year) return null;

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;

    return date;
  };

  const closeDateModal = () => {
    setShowFromPicker(false);
    setShowToPicker(false);
  };

  useEffect(() => {
    if (showFromPicker || showToPicker) {
      setTimeout(() => {
        const input = dateInputRef.current as any;
        input?.focus();
        if (Platform.OS === "web") {
          input?.setSelectionRange?.(0, input.value.length);
        }
      }, 120);
    }
  }, [showFromPicker, showToPicker]);

  const handleDateTextChange = (input: string) => {
    let digits = input.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);

    let formatted = digits;

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  const parseWebDate = (value: string) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day); // تاريخ محلي بدون مشاكل
  };

  const handleConfirmDate = () => {
    if (Platform.OS === "web") {
      const d = parseWebDate(webTempDate);
      if (!d) return;

      const fixed = normalizeDate(d);
      activeDateType === "from" ? setFromDate(fixed) : setToDate(fixed);
    } else {
      const fixed = normalizeDate(tempDate);
      activeDateType === "from" ? setFromDate(fixed) : setToDate(fixed);
    }

    setShowDatePicker(false);
    setActiveDateType(null);
  };
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

      setData((prev) => prev.filter((item) => item.id !== selectedItem.id));

      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      console.error("DELETE CASH OUT ERROR", err.response?.data || err.message);
    }
  };

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
            <Text style={[styles.title, { color: colors.text }]}>
              📄 عرض المنصرف
            </Text>

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

                <View style={styles.dateRow}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setDateInputText(formatDisplayDate(fromDate));
                      setShowFromPicker(true);
                    }}
                  >
                    <Input
                      editable={false}
                      pointerEvents="none"
                      placeholder="من تاريخ"
                      value={fromDate ? formatLocalDate(fromDate) : ""}
                    />
                  </Pressable>

                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setDateInputText(formatDisplayDate(toDate));
                      setShowToPicker(true);
                    }}
                  >
                    <Input
                      editable={false}
                      pointerEvents="none"
                      placeholder="إلى تاريخ"
                      value={toDate ? formatLocalDate(toDate) : ""}
                    />
                  </Pressable>
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

      {Platform.OS === "web" && (showFromPicker || showToPicker) && (
        <View style={styles.modalOverlay}>
          <View style={styles.dateModal}>
            <Text style={styles.dateTitle}>
              {showFromPicker ? "اختر تاريخ البداية" : "اختر تاريخ النهاية"}
            </Text>

            <View style={{ position: "relative", marginBottom: 16 }}>
              <TextInput
                ref={dateInputRef}
                value={dateInputText}
                placeholder="dd/mm/yyyy"
                keyboardType="numeric"
                onChangeText={handleDateTextChange}
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={closeDateModal}
                blurOnSubmit={false}
                style={styles.webDateInput}
              />

              <input
                ref={hiddenDateInputRef}
                type="date"
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                }}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  const newDate = new Date(y, m - 1, d);

                  setDateInputText(formatDisplayDate(newDate));

                  if (showFromPicker) {
                    newDate.setHours(0, 0, 0, 0);
                    setFromDate(newDate);
                  } else {
                    newDate.setHours(23, 59, 59, 999);
                    setToDate(newDate);
                  }
                }}
              />

              <Pressable
                onPress={() =>
                  hiddenDateInputRef.current?.showPicker?.() ||
                  hiddenDateInputRef.current?.click()
                }
                style={{
                  position: "absolute",
                  right: 10,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <Pressable style={styles.confirmBtnModal} onPress={closeDateModal}>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                تم
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {Platform.OS === "ios" && (showFromPicker || showToPicker) && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                marginHorizontal: 20,
                borderRadius: 12,
                padding: 16,
                width: "90%",
                maxWidth: 360,
              }}
            >
              <DateTimePicker
                value={(showFromPicker ? fromDate : toDate) || new Date()}
                mode="date"
                display="spinner"
                textColor={colors.text}
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;

                  if (showFromPicker) {
                    const d = new Date(selectedDate);
                    d.setHours(0, 0, 0, 0);
                    setFromDate(d);
                  } else {
                    const d = new Date(selectedDate);
                    d.setHours(23, 59, 59, 999);
                    setToDate(d);
                  }
                }}
              />

              <Pressable
                onPress={() => {
                  setShowFromPicker(false);
                  setShowToPicker(false);
                }}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  تم
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {showFromPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          onChange={(e, d) => {
            setShowFromPicker(false);
            if (e.type === "set" && d) {
              d.setHours(0, 0, 0, 0);
              setFromDate(d);
            }
          }}
        />
      )}

      {showToPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          onChange={(e, d) => {
            setShowToPicker(false);
            if (e.type === "set" && d) {
              d.setHours(23, 59, 59, 999);
              setToDate(d);
            }
          }}
        />
      )}
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
  dateRow: { flexDirection: "row", gap: 10 },
  dateInput: { flex: 1 },
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
  dateModal: {
    backgroundColor: "#020617",
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  dateTitle: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  webDateInput: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#111827",
    color: "#fff",
    textAlign: "center",
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
