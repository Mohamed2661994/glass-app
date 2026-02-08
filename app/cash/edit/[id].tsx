import { useTheme } from "@/components/context/theme-context";
import DateField from "@/components/date/DateField";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
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
  const [date, setDate] = useState<Date | null>(null);

  const [sourceName, setSourceName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [confirmVisible, setConfirmVisible] = useState(false);
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

        setDate(new Date(item.transaction_date));

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
          <DateField label="تاريخ العملية" value={date} onChange={setDate} />

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
