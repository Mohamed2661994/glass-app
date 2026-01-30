import * as Print from "expo-print";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";

import { ActivityIndicator, ScrollView, Text, View } from "react-native";

type TransferItem = {
  product_name: string;
  manufacturer?: string;
  wholesale_package?: string;
  from_quantity: number;
  to_quantity: number;
  total_price?: number;
};
function Cell({
  text,
  flex,
  bold,
}: {
  text: string;
  flex: number;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flex,
        borderRightWidth: 1,
        borderColor: "#000",
        padding: 6,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: bold ? "bold" : "normal",
          textAlign: "center",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function PrintOnlyPage() {
  const params = useLocalSearchParams();
  const rawData = Array.isArray(params.data) ? params.data[0] : params.data;

  const [items, setItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      handlePrint();
    }, 300);

    if (!rawData) {
      router.back();
      return;
    }

    try {
      const payload = JSON.parse(decodeURIComponent(rawData));
      setItems(payload.items || []);
    } catch (e) {
      console.error("PARSE ERROR", e);
      router.back();
    } finally {
      setLoading(false);
    }

    // 🔙 رجّع الوضع القديم لما تخرج
  }, [rawData]);

  const buildHtml = () => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
body {
  font-family: Arial;
  margin: 0;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #000;
  padding: 6px;
  font-size: 11px;
  text-align: center;
}
th {
  background: #eee;
}
</style>
</head>
<body>
<table>
<thead>
<tr>
  <th>الصنف</th>
  <th>المصنع</th>
  <th>من</th>
  <th>إلى</th>
  <th>السعر</th>
</tr>
</thead>
<tbody>
${
  items.length
    ? items
        .map(
          (i) => `
<tr>
  <td>${i.product_name} ${i.wholesale_package || ""}</td>
  <td>${i.manufacturer || "-"}</td>
  <td>${i.from_quantity}</td>
  <td>${i.to_quantity}</td>
  <td>${(i.total_price || 0).toLocaleString()}</td>
</tr>`,
        )
        .join("")
    : `<tr><td colspan="5">لا توجد بيانات</td></tr>`
}
</tbody>
</table>
</body>
</html>
`;

  const handlePrint = async () => {
    const html = buildHtml();
    await Print.printAsync({ html });
    router.back();
  };
  const totalPrice = items.reduce(
    (sum, item) => sum + parseFloat(String(item.total_price || 0)),
    0,
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <Text
              style={{ color: "#000", fontWeight: "bold", marginBottom: 10 }}
            >
              عدد الأصناف: {items.length}
            </Text>

            <ScrollView horizontal={false}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#000",
                  backgroundColor: "#eee",
                }}
              >
                <Cell text="السعر" flex={1.2} bold />
                <Cell text="إلى المعرض" flex={1} bold />
                <Cell text="من المخزن" flex={1} bold />
                <Cell text="المصنع" flex={1.5} bold />
                <Cell text="الصنف" flex={2} bold />
              </View>

              {/* Rows */}
              {items.length === 0 ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderColor: "#000",
                    padding: 10,
                  }}
                >
                  <Text style={{ textAlign: "center" }}>لا توجد بيانات</Text>
                </View>
              ) : (
                items.map((i, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      borderWidth: 1,
                      borderTopWidth: 0,
                      borderColor: "#000",
                    }}
                  >
                    <Cell
                      text={(i.total_price || 0).toLocaleString()}
                      flex={1.2}
                    />
                    <Cell text={String(i.to_quantity)} flex={1} />
                    <Cell text={String(i.from_quantity)} flex={1} />
                    <Cell text={i.manufacturer || "-"} flex={1.5} />
                    <Cell
                      text={`${i.product_name} ${i.wholesale_package || ""}`}
                      flex={2}
                    />
                  </View>
                ))
              )}

              {/* ✅ الإجمالي في مكانه الصح */}
              <View
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  paddingEnd: 6,
                  borderTopWidth: 1,
                  borderColor: "#000",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 13,
                      marginStart: 6,
                      paddingEnd: 6,
                      writingDirection: "rtl",
                    }}
                  >
                    {totalPrice.toLocaleString()}
                  </Text>
                  <Text style={{ fontWeight: "bold", fontSize: 13 }}>
                    الاجمالي :
                  </Text>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </View>
    </>
  );
}
