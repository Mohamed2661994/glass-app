import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  ActivityIndicator,
  FlatList, // 👈 أضف السطر ده
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "react-native/Libraries/Alert/Alert";

type CashInItem = {
  id: number;
  customer_name: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  description: string;
  transaction_date: string;
  source_type: "manual" | "invoice" | "customer_payment";
  invoice_id?: number;
};

export default function CashInList() {
  const { colors } = useTheme();

  const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);

  const [dateInputText, setDateInputText] = useState("");
  const dateInputRef = useRef<TextInput>(null);
  const [showWebCalendar, setShowWebCalendar] = useState(false);

  const [showToPicker, setShowToPicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [data, setData] = useState<CashInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(true); // ⭐ ADD

  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState("");

  const [filterType, setFilterType] = useState<
    "all" | "manual" | "invoice" | "customer_payment"
  >("all");

  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0); // بداية اليوم

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999); // نهاية اليوم

  const [fromDate, setFromDate] = useState<Date | null>(today);
  const [toDate, setToDate] = useState<Date | null>(endOfToday);

  const fetchCashIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get("/cash-in");
      setData(data.data || []);

      //setData(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const deleteCashIn = async (id: number) => {
    try {
      setDeletingId(id);

      await api.delete(`/cash-in/${id}`);

      // شيل القيد من الليست
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل حذف القيد");
    } finally {
      setDeletingId(null);
    }
  };
  const openDeleteConfirm = (id: number) => {
    setSelectedId(id);
    setConfirmVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCashIn();
    }, []),
  );
  const closeDateModal = () => {
    setShowFromPicker(false);
    setShowToPicker(false);
  };
  const filteredData = data.filter((item) => {
    const matchName =
      searchName.trim() === "" ||
      item.customer_name.toLowerCase().includes(searchName.toLowerCase());

    const matchType = filterType === "all" || item.source_type === filterType;

    const parseLocalDate = (dateStr: string) => {
      const [y, m, d] = dateStr.slice(0, 10).split("-");
      return new Date(Number(y), Number(m) - 1, Number(d), 12);
    };

    const itemDate = parseLocalDate(item.transaction_date);
    itemDate.setHours(12, 0, 0, 0);
    const itemTime = itemDate.getTime();

    const fromTime = fromDate ? fromDate.getTime() : null;
    const toTime = toDate ? toDate.getTime() : null;

    const matchFrom = fromTime ? itemTime >= fromTime : true;
    const matchTo = toTime ? itemTime <= toTime : true;

    return matchName && matchType && matchFrom && matchTo;
  });

  const renderItem = ({ item }: { item: CashInItem }) => {
    const totalAmount =
      item.source_type === "invoice"
        ? Number(item.paid_amount) + Number(item.remaining_amount)
        : Number(item.amount);

    return (
      <View
        style={{
          width: "100%",
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* ===== العنوان ===== */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            {item.customer_name}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons
              name={
                item.source_type === "invoice"
                  ? "document-text"
                  : item.source_type === "customer_payment"
                    ? "card"
                    : "cash"
              }
              size={16}
              color={colors.muted}
            />

            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {item.source_type === "invoice"
                ? "تحصيل فاتورة"
                : item.source_type === "customer_payment"
                  ? "سند دفع عميل"
                  : "وارد يدوي"}
            </Text>
          </View>
        </View>

        {/* ===== البيان ===== */}
        <Text
          style={{
            color: colors.muted,
            marginBottom: 6,
          }}
        >
          {item.source_type === "invoice"
            ? `تحصيل فاتورة بيع رقم ${item.invoice_id}`
            : item.source_type === "customer_payment"
              ? item.description || `سند دفع من العميل ${item.customer_name}`
              : item.description}
        </Text>

        {/* ===== المبالغ ===== */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={{ color: colors.text }}>
            اجمالي الفاتورة: {totalAmount}
          </Text>

          <Text style={{ color: colors.success }}>
            المدفوع: {item.paid_amount}
          </Text>
        </View>

        {item.remaining_amount > 0 && (
          <Text
            style={{
              color: colors.danger,
              marginBottom: 4,
            }}
          >
            المتبقي: {item.remaining_amount}
          </Text>
        )}

        {/* ===== التاريخ ===== */}
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            marginTop: 6,
          }}
        >
          📅 {formatDate(item.transaction_date)}
        </Text>

        {/* ===== أزرار التحكم ===== */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 10,
          }}
        >
          {/* تعديل */}
          <Pressable
            disabled={item.source_type !== "manual"}
            onPress={() => {
              router.push({
                pathname: "/cash/edit/[id]",
                params: {
                  id: String(item.id),
                  date: item.transaction_date,
                },
              });
            }}
            style={{
              opacity: item.source_type !== "manual" ? 0.5 : 1,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.primary,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              تعديل
            </Text>
          </Pressable>

          {/* حذف */}
          <Pressable
            onPress={() => openDeleteConfirm(item.id)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.danger,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              opacity: deletingId === item.id ? 0.6 : 1,
            }}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  حذف
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const inputStyle = {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.text,
    padding: 10,
    borderRadius: 10,
    textAlign: "center" as const,
    borderWidth: 1,
    borderColor: colors.border,
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

  useFocusEffect(
    useCallback(() => {
      if (showFromPicker) {
        setDateInputText(formatDisplayDate(fromDate));
      } else if (showToPicker) {
        setDateInputText(formatDisplayDate(toDate));
      }
    }, [showFromPicker, showToPicker]),
  );

  useFocusEffect(
    useCallback(() => {
      if (showFromPicker || showToPicker) {
        setTimeout(() => {
          const input = dateInputRef.current as any;

          if (input) {
            input.focus();

            // مهم للويب عشان يحدد النص كله
            if (Platform.OS === "web") {
              input.setSelectionRange?.(0, input.value.length);
            }
          }
        }, 120);
      }
    }, [showFromPicker, showToPicker]),
  );

  const handleDateTextChange = (input: string) => {
    // شيل أي حاجة مش رقم
    let digits = input.replace(/\D/g, "");

    // حد أقصى 8 أرقام (ddmmyyyy)
    if (digits.length > 8) digits = digits.slice(0, 8);

    let formatted = digits;

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    setDateInputText(formatted);

    // لو التاريخ اكتمل 10 خانات (dd/mm/yyyy) نحاول نحوله لتاريخ
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "عرض الوارد",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700",
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1, // ⭐ ADD (حل مشكلة السكرول)
            width: "100%",
            maxWidth: 640,
            padding: 16,
          }}
        >
          {/* زر إظهار / إخفاء الفلترة */}
          <Pressable
            onPress={() => setFiltersVisible((v) => !v)}
            style={{
              backgroundColor: colors.card,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              فلترة البحث
            </Text>
            <Ionicons
              name={filtersVisible ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text}
            />
          </Pressable>
          {/* Loading */}
          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          )}

          {/* Error */}
          {!loading && !error && (
            <Text
              style={{
                color: colors.danger,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}

          {/* ===== Filter Card ===== */}
          {filtersVisible && (
            <View
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 14,
                gap: 12,
              }}
            >
              {/* Search */}
              <TextInput
                placeholder="بحث بالاسم..."
                value={searchName}
                onChangeText={setSearchName}
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.input,
                  color: colors.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Type filter */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { key: "all", label: "الكل" },
                  { key: "manual", label: "وارد" },
                  { key: "invoice", label: "تحصيل فاتورة" },
                  { key: "customer_payment", label: "سند دفع عميل" }, // ⭐ الجديد
                ].map((t) => {
                  const active = filterType === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setFilterType(t.key as any)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: active ? colors.primary : colors.input,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#fff" : colors.text,
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date filter */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => {
                    setShowFromPicker(true);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: colors.input,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, textAlign: "center" }}>
                    من: {fromDate ? fromDate.toLocaleDateString("EG") : "--"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowToPicker(true);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: colors.input,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, textAlign: "center" }}>
                    إلى: {toDate ? toDate.toLocaleDateString("EG") : "--"}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  setFromDate(null);
                  setToDate(null);
                  setSearchName("");
                  setFilterType("all");
                }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: colors.botmd,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>مسح الفلترة</Text>
              </Pressable>
            </View>
          )}

          {/* ===== List ===== */}
          {!loading && !error && (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshing={loading}
              onRefresh={fetchCashIn}
            />
          )}
        </View>
      </View>
      {/* ===== Delete Confirm ===== */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 16,
              width: 300,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              تأكيد الحذف
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من حذف هذا القيد؟
            </Text>

            <Pressable
              onPress={() => {
                setConfirmVisible(false);
                setSelectedId(null);
              }}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: "#374151",
                marginBottom: 10,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>إلغاء</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (selectedId) deleteCashIn(selectedId);
                setConfirmVisible(false);
                setSelectedId(null);
              }}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.danger,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>حذف</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ANDROID FROM */}
      {showFromPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (event.type === "set" && selectedDate) {
              const d = new Date(selectedDate);
              d.setHours(0, 0, 0, 0);
              setFromDate(d);
            }
          }}
        />
      )}

      {/* ANDROID TO */}
      {showToPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (event.type === "set" && selectedDate) {
              const d = new Date(selectedDate);
              d.setHours(23, 59, 59, 999);
              setToDate(d);
            }
          }}
        />
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

      {Platform.OS === "web" && (showFromPicker || showToPicker) && (
        <View
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 16,
              width: 320,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {showFromPicker ? "اختر تاريخ البداية" : "اختر تاريخ النهاية"}
            </Text>

            <View style={{ position: "relative", marginBottom: 16 }}>
              <TextInput
                ref={dateInputRef}
                value={dateInputText}
                placeholder="dd/mm/yyyy"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                onChangeText={handleDateTextChange}
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={closeDateModal} // 👈 أهم سطر
                blurOnSubmit={false}
                style={{
                  width: "100%",
                  padding: 12,
                  paddingRight: 40, // مساحة للأيقونة
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.input,
                  color: colors.text,
                  fontSize: 16,
                  textAlign: "center",
                }}
              />
              <input
                ref={hiddenDateInputRef}
                type="date"
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: 0,
                  height: 0,
                }}
                onChange={(e) => {
                  if (!e.target.value) return;

                  const [y, m, d] = e.target.value.split("-").map(Number);
                  const newDate = new Date(y, m - 1, d);

                  const formatted = formatDisplayDate(newDate);
                  setDateInputText(formatted);

                  if (showFromPicker) {
                    newDate.setHours(0, 0, 0, 0);
                    setFromDate(newDate);
                  } else {
                    newDate.setHours(23, 59, 59, 999);
                    setToDate(newDate);
                  }
                }}
              />

              {/* أيقونة الكالندر */}
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
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={closeDateModal}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.primary,
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
      )}

      {Platform.OS === "web" && showWebCalendar && (
        <input
          type="date"
          autoFocus
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            padding: 10,
            fontSize: 16,
          }}
          onChange={(e) => {
            setShowWebCalendar(false);
            if (!e.target.value) return;

            const [y, m, d] = e.target.value.split("-").map(Number);
            const newDate = new Date(y, m - 1, d);

            const formatted = formatDisplayDate(newDate);
            setDateInputText(formatted);

            if (showFromPicker) {
              newDate.setHours(0, 0, 0, 0);
              setFromDate(newDate);
            } else {
              newDate.setHours(23, 59, 59, 999);
              setToDate(newDate);
            }
          }}
        />
      )}
    </>
  );
}
