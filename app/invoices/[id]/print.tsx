import api from "@/services/api";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
// ===== Small UI helpers for print (RTL) =====

const Row = ({
  label,
  value,
  bold = false,
  valueStyle = {},
}: {
  label: string;
  value: any;
  bold?: boolean;
  valueStyle?: any;
}) => (
  <View
    style={{
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      marginBottom: 4,
    }}
  >
    <Text style={{ fontWeight: bold ? "700" : "400", textAlign: "right" }}>
      {label}
    </Text>

    <Text
      style={[
        { fontWeight: bold ? "700" : "400", textAlign: "left" },
        valueStyle,
      ]}
    >
      {value}
    </Text>
  </View>
);

const Divider = ({ bold = false }: { bold?: boolean }) => (
  <View
    style={{
      borderTopWidth: bold ? 1.5 : 1,
      borderColor: "#000",
      marginVertical: 6,
    }}
  />
);

const cell = { paddingHorizontal: 4, fontSize: 13 };
const headerCell = { paddingHorizontal: 4, fontSize: 13 };

export default function InvoicePrintPage() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const fmt = (n: number) => Math.round(n).toString();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}/print`);
        setInvoice(res.data);
      } catch (e) {
        console.error("INVOICE PRINT ERROR", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={{ padding: 20 }}>
        <Text>لم يتم العثور على الفاتورة</Text>
      </View>
    );
  }
  const invoiceType = invoice.invoice_type; // "retail" | "wholesale"

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const applyItemsDiscount = !!invoice.apply_items_discount;

  const calcUnitPrice = (it: any) => {
    const price = Number(it.price) || 0;
    const discount = Number(it.discount) || 0;

    return applyItemsDiscount ? price - discount : price;
  };

  const calcItemTotal = (it: any) =>
    calcUnitPrice(it) * Number(it.quantity || 0);

  // ===== الحسابات =====
  const itemsSubtotal = items.reduce(
    (sum: number, it: any) => sum + calcItemTotal(it),
    0,
  );
  const itemsDiscount = applyItemsDiscount
    ? items.reduce(
        (sum: number, it: any) =>
          sum + (Number(it.discount) || 0) * Number(it.quantity || 0),
        0,
      )
    : 0;

  const rawInvoiceDiscount = Number(invoice.discount_total) || 0;
  // خصم الفاتورة فقط (مش الأصناف)
  const invoiceDiscount = Math.max(rawInvoiceDiscount - itemsDiscount, 0);
  // الإجمالي بعد خصم الفاتورة
  const afterInvoiceDiscount = itemsSubtotal - invoiceDiscount;

  const previousBalance = Number(invoice.previous_balance) || 0;
  const paidAmount = Number(invoice.paid_amount) || 0;

  const totalDue = afterInvoiceDiscount + previousBalance;
  const remaining = totalDue - paidAmount;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{
          backgroundColor: "#fff",
          width: Platform.OS === "web" ? 420 : "100%",
          alignSelf: "center",
          padding: 20,
          direction: "rtl",
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image
            source={require("@/assets/images/logo-dark.png")}
            style={{ width: 70, height: 70, marginBottom: 6 }}
            contentFit="contain"
          />

          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: "700",
              //marginBottom: 10,
            }}
          >
            {invoiceType === "wholesale" ? "فاتورة مخزن" : "فاتورة معرض"}
          </Text>
        </View>
        {/* ===== CUSTOMER INFO ===== */}
        <View
          style={{
            borderWidth: 1.5,
            borderColor: "#000",
            borderRadius: 6,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 12, color: "#555", textAlign: "right" }}>
            اسم العميل
          </Text>

          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              textAlign: "right",
              marginBottom: 6,
            }}
          >
            {invoice.customer_name || "—"}
          </Text>

          <Divider />

          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 13 }}>رقم الفاتورة: {invoice.id}</Text>
            <Text style={{ fontSize: 13 }}>
              التاريخ:{" "}
              {invoice.created_at
                ? new Date(invoice.created_at).toLocaleDateString("ar-EG")
                : "—"}
            </Text>
          </View>
        </View>

        {/* ===== ITEMS ===== */}
        <View
          style={{
            flexDirection: "row-reverse",
            borderBottomWidth: 1,
            paddingBottom: 6,
          }}
        >
          <Text style={{ flex: 3, textAlign: "left", ...headerCell }}>
            الإجمالي
          </Text>
          <Text style={{ flex: 1, textAlign: "center", ...headerCell }}>
            السعر
          </Text>
          <Text style={{ flex: 4, textAlign: "center", ...headerCell }}>
            الكمية
          </Text>
          <Text style={{ flex: 5, textAlign: "right", ...headerCell }}>
            الصنف
          </Text>
        </View>

        {items.map((it: any, idx: number) => (
          <View
            key={`${it.product_id}-${idx}`}
            style={{
              flexDirection: "row-reverse",
              paddingVertical: 6,
              borderBottomWidth: 0.5,
              borderColor: "#ddd",
            }}
          >
            <Text style={{ flex: 3, textAlign: "left", ...cell }}>
              {fmt(calcItemTotal(it))}
            </Text>
            <Text style={{ flex: 1, textAlign: "center", ...cell }}>
              {fmt(calcUnitPrice(it))}
            </Text>
            <Text style={{ flex: 4, textAlign: "center", ...cell }}>
              {it.quantity}
            </Text>
            <Text style={{ flex: 5, textAlign: "right", ...cell }}>
              {it.product_name}
            </Text>
          </View>
        ))}

        {/* ===== TOTALS ===== */}
        <View
          style={{
            marginTop: 18,
            padding: 12,
            borderWidth: 1.5,
            borderColor: "#000",
            borderRadius: 6,
          }}
        >
          <Row label="إجمالي الأصناف" value={fmt(itemsSubtotal)} bold />

          {invoiceDiscount > 0 && (
            <Row
              label="خصم الفاتورة"
              value={`- ${invoiceDiscount.toFixed(2)}`}
            />
          )}

          {previousBalance > 0 && (
            <Row label="الحساب السابق" value={previousBalance.toFixed(2)} />
          )}

          <Divider bold />

          <Row label="الإجمالي المستحق" value={totalDue.toFixed(2)} bold />

          {paidAmount > 0 && (
            <Row label="المدفوع" value={paidAmount.toFixed(2)} />
          )}

          {Math.abs(remaining) > 0.01 && (
            <>
              <Divider />
              <Row
                label="المتبقي"
                value={remaining.toFixed(2)}
                bold
                valueStyle={{
                  color: remaining > 0 ? "#dc2626" : "#16a34a",
                  fontSize: 16,
                }}
              />
            </>
          )}
        </View>

        {Platform.OS === "web" && (
          <Text
            style={{ display: "none" }}
            onLayout={() => setTimeout(() => window.print(), 300)}
          />
        )}
      </ScrollView>
    </>
  );
}
