import { useTheme } from "@/components/context/theme-context";
import DateField from "@/components/date/DateField";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import BackButton from "@/components/ui/BackButton";
import Input from "@/components/ui/Input";

export default function CashOutScreen() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [entryType, setEntryType] = useState<"expense" | "purchase">("expense");

  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [permissionNumber, setPermissionNumber] = useState<string | null>(null);
  const { isDark, colors } = useTheme();
  const [date, setDate] = useState(new Date());

  const { id } = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!rawId;

  useEffect(() => {
    if (!isEdit || !rawId) return;

    const fetchCashOutById = async () => {
      try {
        const { data } = await api.get(`/cash/out/${rawId}`);

        setName(data.name);
        setAmount(String(data.amount));
        setNotes(data.notes || "");

        const parsedDate = new Date(data.transaction_date);
        setDate(parsedDate);

        setPermissionNumber(data.permission_number);
        setEntryType(data.entry_type);
      } catch (err) {
        alert("فشل تحميل بيانات المنصرف");
      }
    };

    fetchCashOutById();
  }, [id]);

  useEffect(() => {
    if (isEdit) return;
  }, []);

  const handleSave = async () => {
    if (!name || !amount) {
      alert("من فضلك أدخل الاسم والمبلغ");
      return;
    }

    setLoading(true);

    try {
      // 👇👇👇 هنا بالظبط
      const payload = {
        // branch_id: 1,
        name,
        amount: Number(amount),
        notes,
        date,
        entry_type: entryType,
      };

      const { data } = isEdit
        ? await api.put(`/cash/out/${rawId}`, payload)
        : await api.post("/cash/out", payload);

      setPermissionNumber(data.permission_number);
      setSuccessModalOpen(true);

      if (!isEdit) {
        setName("");
        setAmount("");
        setNotes("");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "فشل حفظ إذن الصرف");
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
          <DateField label="تاريخ العملية" value={date} onChange={setDate} />

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
            onChangeText={setNotes}
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
