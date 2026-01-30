import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
export default function EditCashIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sourceName, setSourceName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // ✅ التاريخ كنص فقط
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  // ===== تحميل البيانات =====
  useEffect(() => {
    const loadCashIn = async () => {
      try {
        const res = await api.get(`/cash-in/${id}`);
        const item = res.data.data;

        if (!item || item.source_type !== "manual") {
          router.back();
          return;
        }

        const dateStr = item.transaction_date.slice(0, 10);
        setDate(dateStr);

        const [y, m, d] = dateStr.split("-");
        setTempDate(new Date(+y, +m - 1, +d));

        setSourceName(item.customer_name);
        setAmount(String(item.amount));
        setDescription(item.description);
      } catch (err) {
        console.log("LOAD CASH IN ERROR", err);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadCashIn();
  }, [id]);

  // ===== حفظ التعديل =====
  const submitEdit = async () => {
    try {
      setSaving(true);

      await api.put(`/cash-in/${id}`, {
        customer_name: sourceName,
        description,
        amount: Number(amount),
        transaction_date: date,
      });

      router.back();
    } catch (err) {
      alert("حصل خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.input,
    color: colors.text,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "تعديل وارد الخزنة",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      <View
        style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: Platform.OS === "web" ? 420 : "100%",
            alignSelf: "center",
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* الاسم */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>الاسم</Text>
          <Input
            value={sourceName}
            onChangeText={setSourceName}
            style={{ marginBottom: 16, textAlign: "right" }}
          />

          {/* المبلغ */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>المبلغ</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={{
              marginBottom: 16,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
            }}
          />

          {/* التاريخ */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>التاريخ</Text>
          <Pressable
            onPress={() => {
              if (!date) return;
              const [y, m, d] = date.split("-");
              setTempDate(new Date(+y, +m - 1, +d));
              setShowDatePicker(true);
            }}
            style={{
              ...inputStyle,
              marginBottom: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {date ? formatDate(date) : ""}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
          </Pressable>

          {/* Android */}
          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={tempDate || new Date()}
              mode="date"
              onChange={(e, d) => {
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

          {/* iOS */}
          {showDatePicker && Platform.OS === "ios" && (
            <Modal transparent animationType="fade">
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    width: "90%",
                  }}
                >
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(e, d) => {
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
                    style={{
                      marginTop: 12,
                      backgroundColor: "#2563eb",
                      padding: 12,
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

          {/* Web */}
          {showDatePicker && Platform.OS === "web" && (
            <Modal transparent animationType="fade">
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
                    padding: 25,
                    borderRadius: 16,
                    width: 320,
                  }}
                >
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "93%",
                      padding: 10,
                      fontSize: 15,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                    }}
                  />
                  <button
                    onClick={() => setShowDatePicker(false)}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    تم
                  </button>
                </View>
              </View>
            </Modal>
          )}

          {/* البيان */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>البيان</Text>
          <Input
            value={description}
            onChangeText={setDescription}
            multiline
            style={{
              minHeight: 80,
              textAlignVertical: "top",
              marginBottom: 24,
            }}
          />

          {/* حفظ */}
          <Button
            title="حفظ التعديل"
            variant="success"
            onPress={() => setConfirmVisible(true)}
          />
        </View>
      </View>

      {/* تأكيد */}
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
              تأكيد التعديل
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من حفظ التعديلات؟
            </Text>

            <Pressable
              onPress={() => setConfirmVisible(false)}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: "#374151",
                marginBottom: 10,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>إلغاء</Text>
            </Pressable>

            <Pressable
              onPress={submitEdit}
              disabled={saving}
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: "#22c55e",
                width: "100%", // 👈 المهم
                alignItems: "center", // 👈 توسيط النص
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {saving ? "جارٍ الحفظ..." : "تأكيد"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
