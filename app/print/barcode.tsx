import { Stack, useLocalSearchParams } from "expo-router";
import JsBarcode from "jsbarcode";
import { useEffect } from "react";
import { Platform, Text, View } from "react-native";

type Params = {
  barcode: string;
  copies: string;
  retailPrice: string;
  discount: string;
  itemName: string;
};

export default function BarcodePrintPage() {
  const { barcode, copies, retailPrice, discount, itemName } =
    useLocalSearchParams<Params>(); // ✅ هنا صح

  const count = Number(copies || 1);

  // حماية من أي قيم فاضية
  if (!barcode) {
    return <Text>لا يوجد بيانات للطباعة</Text>;
  }

  /* ================= Web Auto Print ================= */
  useEffect(() => {
    if (Platform.OS === "web") {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          padding: 20,
          backgroundColor: "#fff",
          minHeight: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <View
              key={i}
              style={{
                width: Platform.OS === "web" ? "23%" : "100%",
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#000",
                padding: 10,
                alignItems: "center",
                backgroundColor: "#fff",
              }}
            >
              {/* ===== Web: Barcode حقيقي ===== */}
              {Platform.OS === "web" && (
                <svg
                  ref={(el) => {
                    if (el) {
                      JsBarcode(el, barcode, {
                        format: "CODE128",
                        width: 1.6,
                        margin: 0,
                        height: 50,
                        displayValue: false,
                      });
                    }
                  }}
                />
              )}

              {/* ===== بيانات الصنف ===== */}
              <Text style={{ marginTop: 6, fontSize: 12 }}>
                كود الصنف: {barcode}
              </Text>

              <Text style={{ fontSize: 12 }}>اسم الصنف: {itemName || "-"}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}
