import { useAuth } from "@/components/context/AuthContext";
import { API_URL } from "@/services/api";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

import { useTheme } from "@/components/context/theme-context";
import DateFieldFT from "@/components/date/DateRangeField";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { LayoutAnimation, UIManager } from "react-native";

type Invoice = {
  id: number;
  invoice_type: "retail" | "wholesale" | "transfer";
  movement_type: "sale" | "purchase" | "transfer";
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount_total: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: "paid" | "partial" | "unpaid";
  created_at: string;
};
type StockTransfer = {
  id: number;
  branch_id: number;
  note: string | null;
  created_at: string;
  items_count: number;
  total_from_quantity: number; // 👈 الجديد
  status?: "active" | "cancelled";
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { colors, isDark } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [dailySummary, setDailySummary] = useState<Record<string, number>>({});
  const { user } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  type InvoiceScope = "retail" | "wholesale" | "transfer" | "";
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<StockTransfer[]>(
    [],
  );

  const [invoiceScope, setInvoiceScope] = useState<InvoiceScope>("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterMovement, setFilterMovement] = useState<
    "sale" | "purchase" | ""
  >("");

  const today = new Date();

  const [filterFromDate, setFilterFromDate] = useState<Date>(today);
  const [filterToDate, setFilterToDate] = useState<Date>(today);

  /* ================== FETCH ================== */
  const fetchInvoices = async (type: "retail" | "wholesale") => {
    try {
      setLoading(true);
      const { data } = await api.get(`/invoices`, {
        params: { invoice_type: type },
      });

      const list = Array.isArray(data) ? data : [];

      setAllInvoices(list);
      setInvoices(list);
    } catch (e) {
      setAllInvoices([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };
  const groupTransfersByDate = (list: StockTransfer[]) => {
    return list.reduce((acc: Record<string, StockTransfer[]>, tr) => {
      const d = new Date(tr.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(tr);
      return acc;
    }, {});
  };

  const confirmCancelTransfer = (id: number) => {
    setCancelTargetId(id);
    setShowCancelModal(true);
  };

  const cancelTransfer = async (id: number) => {
    try {
      await api.post(`/stock-transfers/${id}/cancel`);
      fetchTransfers();
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل إلغاء التحويل");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;

    setShowCancelModal(false);
    await cancelTransfer(cancelTargetId);
    setCancelTargetId(null);
  };

  /* ================== FILTER ================== */
  const applyFilters = () => {
    setFilterLoading(true);

    setTimeout(() => {
      if (invoiceScope === "transfer") {
        filterTransfersByDate(transfers, filterFromDate, filterToDate);
        setFilterLoading(false);
        return;
      }
      // 👇 الفواتير زي ما هي
      let filtered = [...allInvoices];
      if (filterCustomer.trim()) {
        filtered = filtered.filter((inv) =>
          inv.customer_name
            ?.toLowerCase()
            .includes(filterCustomer.trim().toLowerCase()),
        );
      }

      if (filterMovement) {
        filtered = filtered.filter(
          (inv) => inv.movement_type === filterMovement,
        );
      }

      if (filterFromDate) {
        const from = new Date(filterFromDate);
        from.setHours(0, 0, 0, 0);

        filtered = filtered.filter((inv) => new Date(inv.created_at) >= from);
      }

      if (filterToDate) {
        const to = new Date(filterToDate);
        to.setHours(23, 59, 59, 999);

        filtered = filtered.filter((inv) => new Date(inv.created_at) <= to);
      }

      setInvoices(filtered);
      setFilterLoading(false);
    }, 500); // ⏱️ 5 ثواني
  };

  useEffect(() => {
    if (!invoiceScope) return;

    if (invoiceScope === "transfer") {
      filterTransfersByDate(transfers, filterFromDate, filterToDate);
    } else {
      // 👇 نفس منطق البحث لكن تلقائي
      let filtered = [...allInvoices];

      if (filterCustomer.trim()) {
        filtered = filtered.filter((inv) =>
          inv.customer_name
            ?.toLowerCase()
            .includes(filterCustomer.trim().toLowerCase()),
        );
      }

      if (filterMovement) {
        filtered = filtered.filter(
          (inv) => inv.movement_type === filterMovement,
        );
      }

      if (filterFromDate) {
        const from = new Date(filterFromDate);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((inv) => new Date(inv.created_at) >= from);
      }

      if (filterToDate) {
        const to = new Date(filterToDate);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((inv) => new Date(inv.created_at) <= to);
      }

      setInvoices(filtered);
    }
  }, [
    invoiceScope,
    filterFromDate,
    filterToDate,
    filterCustomer,
    filterMovement,
    allInvoices,
    transfers,
  ]);

  const filterTransfersByDate = (
    list: StockTransfer[],
    from: Date,
    to: Date,
  ) => {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const filtered = list.filter((tr) => {
      const created = new Date(tr.created_at);
      return created >= fromDate && created <= toDate;
    });

    setFilteredTransfers(filtered);
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/stock-transfers`);
      const list: StockTransfer[] = data?.data || [];

      setTransfers(list);
      filterTransfersByDate(list, filterFromDate, filterToDate);

      // 👇 هات إجمالي الأصناف لكل يوم
      const dates: string[] = Array.from(
        new Set(
          list.map((t) => {
            const d = new Date(t.created_at);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          }),
        ),
      );

      const summaryObj: Record<string, number> = {};

      for (const d of dates) {
        const res = await api.get(`/stock-transfers/summary/by-date?date=${d}`);
        summaryObj[d] = Number(res.data.total_quantity) || 0;
      }

      setDailySummary(summaryObj);
    } catch {
      setTransfers([]);
      setFilteredTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedTransfers = groupTransfersByDate(
    invoiceScope === "transfer" ? filteredTransfers : transfers,
  );
  const groupedDates = Object.keys(groupedTransfers).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  /* ================== DELETE ================== */
  const deleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      const { data } = await api.delete(`/invoices/${invoiceToDelete}`);

      // ✅ نجاح
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete));
      setAllInvoices((prev) =>
        prev.filter((inv) => inv.id !== invoiceToDelete),
      );

      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || "فشل مسح الفاتورة");

      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const confirmDelete = (invoiceId: number) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const formatDateArabic = (date: Date | null) => {
    if (!date) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day} / ${month} / ${year}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "الفواتير",
          headerTitleAlign: "center",

          headerRight: () => (
            <Pressable
              onPress={() => {
                if (!invoiceScope) return;

                if (invoiceScope === "transfer") {
                  fetchTransfers();
                } else {
                  fetchInvoices(invoiceScope);
                }
              }}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(tabs)" as never)}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: Platform.OS === "ios" ? 50 : 30,
          maxWidth: 720,
          alignSelf: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            padding: 14,
            borderRadius: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* 🏬 فواتير القطاعي — للمعرض فقط */}
          {user?.branch_id === 1 && (
            <Pressable
              onPress={() => {
                setInvoiceScope("retail");
                fetchInvoices("retail");
              }}
              style={{
                backgroundColor:
                  invoiceScope === "retail" ? colors.success : colors.botmf,
                padding: 12,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.text, textAlign: "center" }}>
                🏬 فواتير المعرض (قطاعي)
              </Text>
            </Pressable>
          )}

          {/* 📦 فواتير الجملة — للمخزن فقط */}
          {user?.branch_id === 2 && (
            <Pressable
              onPress={() => {
                setInvoiceScope("wholesale");
                fetchInvoices("wholesale");
              }}
              style={{
                backgroundColor:
                  invoiceScope === "wholesale" ? colors.success : colors.botmf,
                padding: 12,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.text, textAlign: "center" }}>
                📦 فواتير المخزن (جملة)
              </Text>
            </Pressable>
          )}

          {/* 🔁 فواتير التحويل — للكل */}
          <Pressable
            onPress={() => {
              const today = new Date();

              setInvoiceScope("transfer");
              setFilterMovement("");
              setFilterFromDate(today);
              setFilterToDate(today);

              fetchTransfers();
            }}
            style={{
              backgroundColor:
                invoiceScope === "transfer" ? colors.success : colors.botmf,
              padding: 12,
              borderRadius: 10,
              marginTop: 8,
            }}
          >
            <Text style={{ color: colors.text, textAlign: "center" }}>
              🔁 فواتير التحويل
            </Text>
          </Pressable>
        </View>

        {/* ===== فلترة ===== */}
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setFiltersOpen((prev) => !prev);
          }}
          style={{
            backgroundColor: colors.card,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
            🔍 بحث الفواتير
          </Text>

          <Ionicons
            name={filtersOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#9ca3af"
          />
        </Pressable>

        {filtersOpen && (
          <View
            style={{
              backgroundColor: colors.card,
              padding: 14,
              borderRadius: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* ===== اسم العميل ===== */}
              <TextInput
                value={filterCustomer}
                onChangeText={setFilterCustomer}
                placeholder="اسم العميل"
                placeholderTextColor="#6b7280"
                style={{
                  backgroundColor: colors.input,
                  color: colors.text,
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                  textAlign: "right",
                }}
              />

              {/* ===== نوع الحركة ===== */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <Pressable
                  onPress={() =>
                    setFilterMovement((prev) => (prev === "sale" ? "" : "sale"))
                  }
                  style={{
                    flex: 1,
                    backgroundColor:
                      filterMovement === "sale" ? "#22c55e" : "#5c697e",
                    paddingVertical: 12,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    بيع
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setFilterMovement((prev) =>
                      prev === "purchase" ? "" : "purchase",
                    )
                  }
                  style={{
                    flex: 1,
                    backgroundColor:
                      filterMovement === "purchase" ? "#22c55e" : "#5c697e",
                    paddingVertical: 12,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    شراء
                  </Text>
                </Pressable>
              </View>

              {/* ===== التاريخ ===== */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <DateFieldFT
                  label="من تاريخ"
                  value={filterFromDate}
                  onChange={(date: Date) => {
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    setFilterFromDate(d);
                  }}
                />

                <DateFieldFT
                  label="إلى تاريخ"
                  value={filterToDate}
                  onChange={(date: Date) => {
                    const d = new Date(date);
                    d.setHours(23, 59, 59, 999);
                    setFilterToDate(d);
                  }}
                />
              </View>

              {/* ===== زر تطبيق ===== */}
              <Pressable
                disabled={filterLoading}
                onPress={applyFilters}
                style={{
                  backgroundColor: filterLoading ? "#1e40af" : "#2563eb",
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {filterLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      جاري البحث...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    🔍 بحث
                  </Text>
                )}
              </Pressable>

              {/* ===== مسح الفلاتر ===== */}
              <Pressable
                onPress={() => {
                  setFilterCustomer("");
                  setFilterMovement("");
                  setFilterFromDate(today);
                  setFilterToDate(today);

                  if (invoiceScope === "transfer") {
                    filterTransfersByDate(transfers, today, today);
                  } else {
                    setInvoices(allInvoices);
                  }
                }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  مسح الفلاتر
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {loading && (
          <ActivityIndicator
            size="large"
            color="#22c55e"
            style={{ marginTop: 40 }}
          />
        )}

        {!loading && invoiceScope !== "transfer" && invoices.length === 0 && (
          <Text
            style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}
          >
            لا توجد فواتير
          </Text>
        )}

        {!loading && invoiceScope === "transfer" && transfers.length === 0 && (
          <Text
            style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}
          >
            لا توجد تحويلات
          </Text>
        )}

        {/* ===== INVOICES (Retail / Wholesale) ===== */}
        {!loading &&
          invoiceScope !== "transfer" &&
          invoices.map((inv) => (
            <View
              key={inv.id}
              style={{
                backgroundColor: colors.card,
                padding: 14,
                borderRadius: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row-reverse",
              }}
            >
              {/* ===== يمين: بيانات الفاتورة ===== */}
              <Pressable
                onPress={() => {
                  if (Platform.OS === "web") {
                    window.open(
                      `${API_URL}/invoices/${inv.id}/print`,
                      "_blank",
                    );
                  }
                }}
                style={{ flex: 1, paddingRight: 6 }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                    textAlign: "right",
                  }}
                >
                  فاتورة رقم #{inv.id}
                </Text>

                <Text style={{ color: colors.muted, textAlign: "right" }}>
                  التاريخ:{" "}
                  {new Date(inv.created_at).toLocaleDateString("ar-EG")}
                </Text>

                <Text style={{ color: colors.muted, textAlign: "right" }}>
                  نوع الحركة:{" "}
                  {inv.movement_type === "purchase" ? "شراء" : "بيع"}
                </Text>

                <Text style={{ color: colors.muted, textAlign: "right" }}>
                  الإجمالي: {inv.total}
                </Text>

                <Text style={{ color: colors.muted, textAlign: "right" }}>
                  المدفوع: {inv.paid_amount}
                </Text>

                <Text
                  style={{
                    color: inv.remaining_amount > 0 ? "#ef4444" : "#22c55e",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  المتبقي: {inv.remaining_amount}
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontWeight: "700",
                    textAlign: "right",
                    color:
                      inv.payment_status === "paid"
                        ? "#22c55e"
                        : inv.payment_status === "partial"
                          ? "#eab308"
                          : "#ef4444",
                  }}
                >
                  الحالة:{" "}
                  {inv.payment_status === "paid"
                    ? "مدفوعة"
                    : inv.payment_status === "partial"
                      ? "مدفوعة جزئيًا"
                      : "غير مدفوعة"}
                </Text>
              </Pressable>

              {/* ===== شمال: الأزرار ===== */}
              <View style={{ justifyContent: "space-between", marginLeft: 12 }}>
                {/* تعديل */}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname:
                        inv.invoice_type === "wholesale"
                          ? "/invoices/wholesale/[id]"
                          : "/invoices/retail/[id]",
                      params: {
                        id: String(inv.id),
                      },
                    } as any)
                  }
                  style={{
                    backgroundColor: colors.botme,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    ✏️
                  </Text>
                </Pressable>

                {/* مسح */}
                <Pressable
                  onPress={() => confirmDelete(inv.id)}
                  style={{
                    backgroundColor: colors.botmd,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    🗑️
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

        {!loading &&
          invoiceScope === "transfer" &&
          groupedDates.map((date) => (
            <View key={date} style={{ marginBottom: 18 }}>
              {/* ===== عنوان التاريخ ===== */}
              <View
                style={{
                  backgroundColor: colors.input,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              ></View>

              <View
                style={{
                  backgroundColor: colors.card,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/transfers/by-date",
                      params: { date },
                    })
                  }
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      fontSize: 16,
                      textAlign: "right",
                    }}
                  >
                    🔁 تحويلات يوم {new Date(date).toLocaleDateString("ar-EG")}
                  </Text>

                  <Text style={{ color: colors.muted, marginTop: 4 }}>
                    عدد التحويلات: {groupedTransfers[date].length}
                  </Text>

                  <Text style={{ color: colors.muted }}>
                    إجمالي الأصناف: {dailySummary[date] ?? 0}
                  </Text>

                  <View
                    style={{
                      marginTop: 10,
                      alignSelf: "flex-start",
                      backgroundColor: "#14532d",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      عرض التفاصيل
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* ===== مودال تأكيد المسح ===== */}
      {showDeleteModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              width: "85%",
              maxWidth: 320,
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
              تأكيد مسح الفاتورة
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من مسح الفاتورة؟
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setInvoiceToDelete(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#374151",
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: colors.text, textAlign: "center" }}>
                  إلغاء
                </Text>
              </Pressable>

              <Pressable
                onPress={deleteInvoice}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  مسح
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showCancelModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 18,
              width: "85%",
              maxWidth: 320,
              borderWidth: 1,
              borderColor: colors.border,
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
              تأكيد الإلغاء
            </Text>

            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل أنت متأكد من إلغاء التحويل؟ سيتم عكس تأثيره على المخزن.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelTargetId(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#374151",
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  إلغاء
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmCancel}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  تأكيد
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
}
