import logoFile from "@/assets/images/logo-dark.png";
import { Asset } from "expo-asset";

import api from "@/services/api";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";

const ROWS_PER_PAGE = 20;

const chunkItems = (arr: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export default function InvoicePrintPage() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const isWeb = Platform.OS === "web";
  const logoUri = Asset.fromModule(logoFile).uri;

  useEffect(() => {
    if (!id) return setLoading(false);
    api
      .get(`/invoices/${id}/print`)
      .then((res) => setInvoice(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!invoice) return <Text>لم يتم العثور على الفاتورة</Text>;

  const items = invoice.items || [];
  const pages = chunkItems(items, ROWS_PER_PAGE);
  const totalPages = pages.length;

  const calcUnitPrice = (it: any) =>
    invoice.apply_items_discount
      ? Number(it.price) - Number(it.discount || 0)
      : Number(it.price);

  const calcItemTotal = (it: any) =>
    calcUnitPrice(it) * Number(it.quantity || 0);

  // إجمالي بعد خصم الأصناف (لو مفعّل)
  const itemsSubtotal = items.reduce(
    (sum: number, it: any) => sum + calcItemTotal(it),
    0,
  );

  // إجمالي خصم الأصناف قبل ما يتخصم
  const itemsDiscountTotal = items.reduce(
    (sum: number, it: any) =>
      sum + Number(it.discount || 0) * Number(it.quantity || 0),
    0,
  );

  // الخصم الإضافي على مستوى الفاتورة
  const extraDiscount = Number(invoice.manual_discount || 0);

  const previousBalance = Number(invoice.previous_balance) || 0;
  const paidAmount = Number(invoice.paid_amount) || 0;

  // 1️⃣ إجمالي الفاتورة قبل الخصم
  const invoiceTotal = itemsSubtotal;

  // 2️⃣ إجمالي مع الحساب السابق
  const totalWithPrevious = invoiceTotal + previousBalance;

  // 3️⃣ الصافي بعد الخصم الإضافي
  const netTotal = totalWithPrevious - extraDiscount;

  // 4️⃣ المتبقي بعد الدفع
  const remaining = netTotal - paidAmount;

  const totalQty = items.reduce(
    (sum: number, it: any) => sum + Number(it.quantity || 0),
    0,
  );

  const getPackageValue = (it: any) =>
    it.package || it.retail_package || it.unit_package || it.pack || "";

  const formatPackage = (it: any) => {
    const raw =
      it.package ??
      it.item_package ??
      it.product_package ??
      it.retail_package ??
      it.wholesale_package ??
      "";

    if (!raw) return "-";

    let text = String(raw).replace("كرتونة", "").trim();

    let match = text.match(/^([^\d]+)\s*(\d+)$/);
    if (match) return `${match[2]} ${match[1].trim()}`;

    match = text.match(/^(\d+)\s*([^\d]+)$/);
    if (match) return `${match[1]} ${match[2].trim()}`;

    return text;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {isWeb ? (
        <>
          <style>{`
           /* ===============================
   عرض عادي (على الشاشة)
================================ */

body {
  background: #e5e5e5;
  font-family: Tahoma, Arial;
}

.spread {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  margin: 20px;
}

.page {
  width: 148mm;
  min-height: 210mm;
  background: white;
  padding: 10mm;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.invoice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.invoice-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  flex: 1;
}

.invoice-info {
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
  min-width: 170px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th {
  background: #f3f3f3;
  font-weight: bold;
  border-bottom: 2px solid #000;
}

td {
  border-bottom: 1px solid #ddd;
}

th,
td {
  padding: 6px;
  text-align: center;
}

/* ===============================
   إعدادات الورق
================================ */

@page {
  size: A5 portrait;
  margin: 0;
}

/* ===============================
   الطباعة (الحل النهائي)
================================ */

@media print {
  /* نخفي كل حاجة */
  body * {
    visibility: hidden;
  }

  /* نُظهر الفاتورة فقط */
  .spread,
  .spread * {
    visibility: visible;
  }

  body {
    margin: 0;
    background: white;
  }

  /* نلغي flex نهائيًا */
  .spread {
    display: block !important;
    position: static;
    width: 100%;
    margin: 0;
    gap: 0 !important;
  }

  /* كل صفحة = ورقة مستقلة */
  .page {
    display: block;
    width: 148mm;
    height: 210mm;
    margin: 0 auto;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
    overflow: visible;
  }
  .page:first-child {
    page-break-before: auto;
    break-before: auto;
  }

  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* إصلاح كسر الجداول */
  table {
    page-break-inside: auto;
    break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }
}


          `}</style>

          <div className="spread">
            {pages.map((pageItems, pageIndex) => {
              const isLastPage = pageIndex === totalPages - 1;

              return (
                <div className="page" key={pageIndex}>
                  {/* ✅ HEADER احترافي خفيف */}
                  {pageIndex === 0 && (
                    <>
                      <div className="invoice-header">
                        {/* اللوجو شمال */}
                        <img src={logoUri} style={{ width: 65 }} />

                        {/* بيانات العميل يمين */}
                        <div className="invoice-info">
                          <div>
                            <b>رقم الفاتورة:</b> {invoice.id}
                          </div>
                          <div>
                            <b>التاريخ:</b>{" "}
                            {new Date(invoice.created_at).toLocaleDateString(
                              "ar-EG",
                            )}
                          </div>
                          <div>
                            <b>العميل:</b> {invoice.customer_name}
                          </div>
                          {invoice.customer_phone && (
                            <div>
                              <b>تليفون:</b> {invoice.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <hr
                        style={{
                          border: "none",
                          borderTop: "2px solid #000",
                          marginBottom: 10,
                        }}
                      />
                    </>
                  )}

                  <table>
                    <thead>
                      <tr>
                        <th>الإجمالي</th>
                        <th>السعر</th>
                        <th>الكمية</th>
                        <th>العبوة</th>
                        <th>الصنف</th>
                        <th>م</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((it: any, i: number) => (
                        <tr key={i}>
                          <td>{Math.round(calcItemTotal(it))}</td>
                          <td>{Math.round(calcUnitPrice(it))}</td>
                          <td>{it.quantity}</td>
                          <td>{formatPackage(it)}</td>

                          <td>
                            {it.product_name}
                            {it.manufacturer ? ` - ${it.manufacturer}` : ""}
                          </td>
                          <td>{pageIndex * ROWS_PER_PAGE + i + 1}</td>
                        </tr>
                      ))}
                    </tbody>

                    {isLastPage && (
                      <tfoot>
                        <tr
                          style={{ fontWeight: "bold", background: "#fafafa" }}
                        >
                          <td>{Math.round(itemsSubtotal)}</td>

                          <td></td>
                          <td>{totalQty}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  {isLastPage && (
                    <div
                      style={{
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: "2px solid #000",
                        width: "55%",
                        fontSize: 13,
                        lineHeight: 1.9,
                      }}
                    >
                      {previousBalance !== 0 && (
                        <div>حساب سابق: {previousBalance.toFixed(2)}</div>
                      )}

                      {extraDiscount > 0 && (
                        <div>خصم : {extraDiscount.toFixed(2)}</div>
                      )}

                      <div>
                        <b>الصافي: {netTotal.toFixed(2)}</b>
                      </div>

                      {paidAmount !== 0 && (
                        <div>المدفوع: {paidAmount.toFixed(2)}</div>
                      )}

                      {remaining !== 0 && (
                        <div style={{ fontSize: 15 }}>
                          <b>المتبقي: {remaining.toFixed(2)}</b>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <View>
          <Text>الطباعة متاحة من المتصفح فقط</Text>
        </View>
      )}
    </>
  );
}
