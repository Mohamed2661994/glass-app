import { useTheme } from "@/components/context/theme-context";
import Button from "@/components/ui/Button";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { API_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

export default function CashOutScreen() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [entryType, setEntryType] = useState<"expense" | "purchase">("expense");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [permissionNumber, setPermissionNumber] = useState<string | null>(null);
  const { isDark, colors } = useTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!rawId;

  useEffect(() => {
    if (!isEdit || !rawId) return;

    const fetchCashOutById = async () => {
      try {
        const res = await fetch(`${API_URL}/cash/out/${rawId}`);
        const json = await res.json();

        setName(json.name);
        setAmount(String(json.amount));
        setNotes(json.notes || "");
        const datePart = json.transaction_date.includes("T")
          ? json.transaction_date.split("T")[0]
          : json.transaction_date;

        setDate(datePart);

        setPermissionNumber(json.permission_number);
        setEntryType(json.entry_type);
      } catch (err) {
        alert("فشل تحميل بيانات المنصرف");
      }
    };

    fetchCashOutById();
  }, [id]);

  useEffect(() => {
    if (isEdit) return;

    const now = new Date();
    setDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(now.getDate()).padStart(2, "0")}`,
    );
  }, []);

  const handleSave = async () => {
    if (!name || !amount) {
      alert("من فضلك أدخل الاسم والمبلغ");
      return;
    }

    setLoading(true);

    try {
      // 👇👇👇 هنا بالظبط
      const url = isEdit
        ? `${API_URL}/cash/out/${rawId}`
        : `${API_URL}/cash/out`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: 1,
          name,
          amount: Number(amount),
          notes,
          date,
          entry_type: entryType, // 👈 السطر المهم
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطأ غير متوقع");
      }

      setPermissionNumber(data.permission_number);
      setSuccessModalOpen(true);

      if (!isEdit) {
        setName("");
        setAmount("");
        setNotes("");
      }
    } catch (err: any) {
      alert(err.message || "فشل حفظ إذن الصرف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "صرف نقدي",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700",
          },
          headerShadowVisible: false,

          headerLeft: () => <BackButton />,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.formWrapper}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEdit ? "✏️ تعديل منصرف" : "💸 صرف نقدي"}
          </Text>

          <Text style={[styles.subTitle, { color: colors.muted }]}>
            تسجيل حركة منصرف على الخزنة
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 16,
            }}
          />

          {/* رقم الإذن */}
          <Text style={[styles.label, { color: colors.muted }]}>رقم الإذن</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={
              isEdit && permissionNumber
                ? permissionNumber
                : "— سيتم توليده تلقائيًا —"
            }
            editable={false}
          />

          {/* الاسم */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>الاسم</Text>

          <Input
            value={name}
            onChangeText={setName}
            placeholder="مثال: كهرباء – مصروفات"
          />

          {/* نوع القيد */}
          <Text style={[styles.label, { color: colors.muted }]}>نوع القيد</Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <Pressable
              onPress={() => setEntryType("expense")}
              style={[
                styles.typeBtn,
                {
                  backgroundColor:
                    entryType === "expense" ? colors.primary : colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: entryType === "expense" ? "#fff" : colors.text,
                  fontWeight: "600",
                }}
              >
                مصروفات
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEntryType("purchase")}
              style={[
                styles.typeBtn,
                {
                  backgroundColor:
                    entryType === "purchase" ? colors.primary : colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: entryType === "purchase" ? "#fff" : colors.text,
                  fontWeight: "600",
                }}
              >
                مشتريات
              </Text>
            </Pressable>
          </View>

          {/* التاريخ */}
          <Text style={[styles.label, { color: colors.muted }]}>التاريخ</Text>

          <Card
            onPress={() => {
              const [y, m, d] = date.split("-");
              setTempDate(new Date(+y, +m - 1, +d));
              setShowDatePicker(true);
            }}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {date}
            </Text>

            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
          </Card>

          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={tempDate || new Date()}
              mode="date"
              onChange={(_, d) => {
                if (!d) return;
                setDate(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                    2,
                    "0",
                  )}-${String(d.getDate()).padStart(2, "0")}`,
                );
                setShowDatePicker(false);
              }}
            />
          )}

          {showDatePicker && Platform.OS === "ios" && (
            <Modal transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View
                  style={[styles.modalBox, { backgroundColor: colors.card }]}
                >
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(_, d) => {
                      if (!d) return;
                      setDate(
                        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                          2,
                          "0",
                        )}-${String(d.getDate()).padStart(2, "0")}`,
                      );
                    }}
                  />

                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={[
                      styles.modalBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>تم</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          )}

          {showDatePicker && Platform.OS === "web" && (
            <Modal transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View
                  style={[styles.modalBox, { backgroundColor: colors.card }]}
                >
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setShowDatePicker(false); // 👈 نفس زر "تم"
                      }
                    }}
                    style={{ width: "100%", padding: 10 }}
                  />
                  <button
                    onClick={() => setShowDatePicker(false)}
                    style={{
                      marginTop: 14,
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "8px 26px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#1d4ed8")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#2563eb")
                    }
                  >
                    تم
                  </button>
                </View>
              </View>
            </Modal>
          )}

          {/* المبلغ */}
          <Text style={[styles.label, { color: colors.muted }]}>المبلغ</Text>
          <Input
            value={amount}
            keyboardType="numeric"
            placeholder="0.00"
            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
          />

          {/* ملاحظات */}
          <Text style={[styles.label, { color: colors.muted }]}>
            ملاحظات (اختياري)
          </Text>
          <Input
            value={notes}
            placeholder="أي تفاصيل إضافية"
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          {/* زر الحفظ */}
          <View style={{ marginTop: 20 }}>
            <Button
              title={
                loading
                  ? "جارٍ الحفظ..."
                  : isEdit
                    ? "حفظ التعديل"
                    : "حفظ المنصرف"
              }
              variant={isEdit ? "primary" : "danger"}
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>

      {successModalOpen && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.modalTitle}>✅ تم الحفظ</Text>

            <Text style={[styles.modalText, { color: colors.text }]}>
              تم حفظ إذن الصرف بنجاح
            </Text>

            <Text style={[styles.permissionNumber, { color: colors.primary }]}>
              رقم الإذن: {permissionNumber}
            </Text>

            <Button
              title="تم"
              variant="primary"
              onPress={() => {
                setSuccessModalOpen(false);
                if (isEdit) router.back();
              }}
            />
          </View>
        </View>
      )}
    </>
  );
}

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subTitle: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    color: "#cbd5f5",
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
  },
  dateInput: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    flex: 1,
    color: "#fff",
  },

  saveBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    width: "100%", // 👈 ياخد عرض الفورم
    maxWidth: 340, // 👈 أعرض شوية
    alignSelf: "center",
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48, // 👈 ده المهم
  },

  saveText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  formWrapper: {
    width: "100%",
    maxWidth: 400, // 👈 العرض اللي انت عاوزه
    alignSelf: "center",
  },

  /* ===== Modal ===== */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalBox: {
    width: 300,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
  },
  modalTitle: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalText: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionNumber: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
