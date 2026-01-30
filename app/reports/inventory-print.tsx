import api from "@/services/api";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Text,
  View,
} from "react-native";

type InventoryItem = {
  product_id: number;
  product_name: string;
  manufacturer: string;
  quantity: number;
  purchase_price: number;
  total_value: number;
};

export default function InventoryPrintPage() {
  const params = useLocalSearchParams();
  const warehouse_id = params.warehouse_id || "";
  const manufacturer = params.manufacturer || "";

  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get("/reports/inventory-details", {
        params: {
          warehouse_id: warehouse_id || undefined,
          manufacturer: manufacturer || undefined,
        },
      });

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("PRINT REPORT ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = data.reduce((sum, i) => sum + Number(i.total_value), 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingVertical: 30,
          alignItems: "center",
        }}
      >
        {/* ورقة الطباعة */}
        <View
          style={{
            width: "100%",
            maxWidth: 800, // عرض ورقة A4
            padding: 20,
          }}
        >
          {/* عنوان */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            تقرير قيمة المخزون
          </Text>

          <View style={{ marginBottom: 15 }}>
            <Text>التاريخ: {new Date().toLocaleDateString()}</Text>
            <Text>
              المخزن:{" "}
              {warehouse_id
                ? warehouse_id == "1"
                  ? "المخزن الرئيسي"
                  : "مخزن المعرض"
                : "كل المخازن"}
            </Text>
            <Text>المصنع: {manufacturer || "كل المصانع"}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              {/* رأس الجدول */}
              <View
                style={{
                  flexDirection: "row-reverse",
                  borderTopWidth: 2,
                  borderBottomWidth: 2,
                  paddingVertical: 8,
                  backgroundColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{ flex: 2, fontWeight: "700", textAlign: "center" }}
                >
                  الصنف
                </Text>
                <Text
                  style={{ flex: 1, fontWeight: "700", textAlign: "center" }}
                >
                  الكمية
                </Text>
                <Text
                  style={{ flex: 1, fontWeight: "700", textAlign: "center" }}
                >
                  سعر الشراء
                </Text>
                <Text
                  style={{ flex: 1, fontWeight: "700", textAlign: "center" }}
                >
                  الإجمالي
                </Text>
              </View>

              <FlatList
                data={data}
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      borderBottomWidth: 1,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ flex: 2, textAlign: "center" }}>
                      {item.product_name} - {item.manufacturer}
                    </Text>
                    <Text style={{ flex: 1, textAlign: "center" }}>
                      {item.quantity}
                    </Text>
                    <Text style={{ flex: 1, textAlign: "center" }}>
                      {item.purchase_price.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      {item.total_value.toLocaleString()}
                    </Text>
                  </View>
                )}
              />

              {/* الإجمالي */}
              <View
                style={{
                  marginTop: 10,
                  borderTopWidth: 2,
                  paddingTop: 8,
                  alignItems: "flex-end",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700" }}>
                  إجمالي قيمة المخزون: {totalValue.toLocaleString()} ج
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      {Platform.OS === "web" && !loading && (
        <Text
          style={{ display: "none" }}
          onLayout={() => setTimeout(() => window.print(), 300)}
        />
      )}
    </>
  );
}
