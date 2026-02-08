import { useTheme } from "@/components/context/theme-context";
import DateField from "@/components/date/DateField";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Platform, Pressable, Text, View } from "react-native";

export default function CashInForm() {
  const { colors } = useTheme();
  const [sourceName, setSourceName] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [cashInNumber, setCashInNumber] = useState<number | null>(null);
  const [entryType, setEntryType] = useState<"manual" | "customer_payment">(
    "manual",
  );
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const finalDescription =
    description || (entryType === "customer_payment" ? "سند دفع" : "وارد نقدي");

  const saveCashIn = async () => {
    // 1️⃣ التحقق من الجهة
    if (!sourceName.trim()) {
      Alert.alert("تنبيه", "برجاء إدخال الاسم");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("تنبيه", "برجاء إدخال مبلغ صحيح");
      return;
    }

    setConfirmVisible(true); // 👈 افتح مودال التأكيد
    console.log("SAVE CLICKED");
  };

  const submitCashIn = async () => {
    try {
      setLoading(true);

      const { data } = await api.post("/cash/in", {
        //branch_id: 1,
        transaction_date: date.toISOString().split("T")[0],
        customer_name: sourceName,
        description: finalDescription,
        amount: Number(amount),
        source_type: entryType,
      });

      setConfirmVisible(false);
      setCashInNumber(data.cash_in_id);
      setSuccessVisible(true);

      // تفريغ الفورم
      setSourceName("");
      setAmount("");
      setDescription("");
      setDate(new Date());
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل تسجيل الوارد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "وارد الخزنة",
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
          padding: 16,
        }}
      >
        {/* ===== CONTAINER ===== */}
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
          <Text style={{ color: colors.muted, marginBottom: 6 }}>
            {entryType === "customer_payment" ? "اسم العميل" : "الاسم"}
          </Text>

          <Input
            value={sourceName}
            onChangeText={setSourceName}
            placeholder="اسم القيد"
            style={{ marginBottom: 16, textAlign: "right" }}
          />
          <Text style={{ color: colors.muted, marginBottom: 6 }}>
            نوع القيد
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Pressable
              onPress={() => setEntryType("manual")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  entryType === "manual" ? "#2563eb" : colors.border,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                وارد عادي
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEntryType("customer_payment")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  entryType === "customer_payment" ? "#16a34a" : colors.border,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                سند دفع عميل
              </Text>
            </Pressable>
          </View>

          {/* ===== المبلغ ===== */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>المبلغ</Text>

          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            style={{
              marginBottom: 16,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
            }}
          />

          {/* ===== التاريخ ===== */}
          <DateField label="تاريخ العملية" value={date} onChange={setDate} />

          {/* ===== البيان ===== */}
          <Text style={{ color: colors.muted, marginBottom: 6 }}>البيان</Text>

          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="سبب الوارد"
            multiline
            style={{
              minHeight: 80,
              textAlignVertical: "top",
              marginBottom: 24,
            }}
          />

          {/* ===== زر الحفظ ===== */}
          <Button
            title="حفظ الوارد"
            variant="success"
            onPress={saveCashIn}
            disabled={loading}
          />
        </View>
      </View>
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
              تأكيد الحفظ
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من تسجيل هذا الوارد؟
            </Text>

            <Button
              title="إلغاء"
              variant="ghost"
              onPress={() => setConfirmVisible(false)}
            />

            <Button
              title={loading ? "جارٍ الحفظ..." : "تأكيد"}
              variant="primary"
              onPress={submitCashIn}
              disabled={loading}
            />
          </View>
        </View>
      </Modal>
      <Modal transparent visible={successVisible} animationType="fade">
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
              ✅ تم بنجاح
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              تم تسجيل القيد برقم ({cashInNumber})
            </Text>

            <Button
              title="تم"
              variant="primary"
              onPress={() => setSuccessVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
