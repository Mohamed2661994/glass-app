import { useTheme } from "@/components/context/theme-context";
import DateFieldFT from "@/components/date/DateRangeField";
import BackButton from "@/components/ui/BackButton";
import { useUser } from "@/hooks/useUser";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type MovementItem = {
  created_at?: string | null;
  movement_date?: string | null;
  invoice_date?: string | null;
  entry_date?: string | null; // ✅ تاريخ القيد

  product_name: string;
  manufacturer_name?: string | null;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  note?: string | null;
  party_name?: string | null;
  invoice_type?: string | null;
};

export default function ProductMovementReportScreen() {
  const [data, setData] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const listRef = useRef<FlatList>(null);
  const { colors } = useTheme();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [productName, setProductName] = useState("");
  const [partyName, setPartyName] = useState(""); // ✅ فلترة العميل
  const { user } = useUser();

  const isShowroomUser = user?.branch_id === 1; // معرض
  const isWarehouseUser = user?.branch_id === 2; // مخزن رئيسي
  const isBranchUser = !!user?.branch_id;
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;

    if (user.branch_id === 1)
      setWarehouseId("1"); // جرد المعرض
    else if (user.branch_id === 2)
      setWarehouseId("2"); // جرد المخزن
    else setWarehouseId(null); // أدمن
  }, [user]);

  const [selectedProductName, setSelectedProductName] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  useEffect(() => {
    if (productModalVisible && filteredProducts.length > 0) {
      listRef.current?.scrollToIndex({
        index: highlightIndex,
        animated: true,
        viewPosition: 0.5, // يخليه في نص القائمة
      });
    }
  }, [highlightIndex]);

  const selectProduct = (item: any) => {
    setProductName(item.name);
    setProductModalVisible(false);
    setProductSearch("");
    setHighlightIndex(0);
  };
  const renderProductItem = ({ item, index }: any) => {
    const isActive = index === highlightIndex;

    return (
      <TouchableOpacity
        style={[styles.productRow, isActive && styles.activeProductRow]}
        onPress={() => selectProduct(item)}
      >
        <Text style={styles.productName}>{item.name}</Text>
        {item.manufacturer && (
          <Text style={styles.productManufacturer}>{item.manufacturer}</Text>
        )}
      </TouchableOpacity>
    );
  };
  useEffect(() => {
    const today = new Date();

    const from = new Date(today);
    from.setHours(0, 0, 0, 0);

    const to = new Date(today);
    to.setHours(23, 59, 59, 999);

    setFromDate(from);
    setToDate(to);
  }, []);

  // ✅ البحث التلقائي مع Delay بسيط
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (productName.trim().length > 0) {
        fetchReport();
      } else {
        setData([]);
        setSelectedProductName("");
      }
    }, 500); // نص ثانية بعد ما يوقف كتابة

    return () => clearTimeout(delayDebounce);
  }, [productName, warehouseId, fromDate, toDate, partyName]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/reports/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("Products fetch error", e);
    }
  };

  useEffect(() => {
    if (productModalVisible && products.length === 0) {
      fetchProducts();
    }
  }, [productModalVisible]);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await api.get("/reports/product-movement", {
        params: {
          product_name: productName || undefined,
          warehouse_id: warehouseId || undefined,
          from: fromDate ? formatDateForAPI(fromDate) : undefined,
          to: toDate ? formatDateForAPI(toDate) : undefined,
          party_name: partyName || undefined,
        },
      });

      const rows = Array.isArray(res.data) ? res.data : [];
      setData(rows);

      if (rows.length > 0) {
        setSelectedProductName(
          `${rows[0].product_name} - ${rows[0].manufacturer_name || ""}`,
        );
      } else {
        setSelectedProductName("");
      }
    } catch (error) {
      console.log("Movement Report Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };
  const formatDateForAPI = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isIncoming = (type: string) =>
    ["purchase", "transfer_in", "replace_in"].includes(type);

  const isOutgoing = (type: string) =>
    ["sale", "transfer_out", "replace_out"].includes(type);

  const renderItem = ({ item }: { item: MovementItem }) => {
    const rawDate = item.created_at || item.movement_date || item.invoice_date;

    const date = rawDate ? new Date(rawDate).toLocaleDateString("ar-EG") : "—";

    return (
      <View style={styles.rowItem}>
        <Text style={[styles.cell, styles.partyCell]}>
          {item.party_name || "—"}
        </Text>

        <Text style={[styles.cell, styles.outCell]}>
          {isOutgoing(item.movement_type) ? item.quantity : ""}
        </Text>

        <Text style={[styles.cell, styles.inCell]}>
          {isIncoming(item.movement_type) ? item.quantity : ""}
        </Text>

        <Text style={styles.cell}>{item.warehouse_name}</Text>
        <Text style={styles.cell}>{date}</Text>
      </View>
    );
  };

  const clearFilters = () => {
    setProductName("");
    setPartyName("");
    setSelectedProductName("");
    setData([]);

    // رجّع المخزن حسب صلاحية المستخدم
    if (user?.branch_id === 1) setWarehouseId("1");
    else if (user?.branch_id === 2) setWarehouseId("2");
    else setWarehouseId(null);

    // التاريخ يرجع لليوم
    const today = new Date();
    const from = new Date(today);
    from.setHours(0, 0, 0, 0);

    const to = new Date(today);
    to.setHours(23, 59, 59, 999);

    setFromDate(from);
    setToDate(to);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="cube-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                تقرير حركة صنف
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* 🔍 اسم الصنف */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={[
            styles.input,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
          onPress={() => setProductModalVisible(true)}
        >
          <Text style={{ color: productName ? "#000" : "#94a3b8" }}>
            {productName || "اختر صنف"}
          </Text>
          <Text style={{ fontSize: 18 }}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* 👤 فلترة باسم العميل */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="اسم العميل / المورد"
          value={partyName}
          onChangeText={setPartyName}
          style={styles.input}
        />
      </View>

      {/* 📅 فلترة التاريخ */}
      <View style={styles.dateFilterBox}>
        <View style={styles.dateRow}>
          <DateFieldFT
            label="من تاريخ"
            value={fromDate}
            onChange={(date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              setFromDate(d);
            }}
          />

          <DateFieldFT
            label="إلى تاريخ"
            value={toDate}
            onChange={(date) => {
              const d = new Date(date);
              d.setHours(23, 59, 59, 999);
              setToDate(d);
            }}
          />
        </View>
      </View>

      {/* 🏬 فلترة المخزن */}
      <View style={styles.filterRow}>
        {[
          ...(!isBranchUser ? [{ id: null, name: "كل المخازن" }] : []),

          {
            id: "2",
            name: "جرد المخزن",
            disabled: isShowroomUser, // المعرض ما يشوفوش
          },

          {
            id: "1",
            name: "جرد المعرض",
            disabled: isWarehouseUser, // المخزن ما يشوفوش
          },
        ].map((w) => (
          <TouchableOpacity
            key={w.name}
            disabled={w.disabled}
            style={[
              styles.filterBtn,
              warehouseId === w.id && styles.activeFilterBtn,
              w.disabled && { opacity: 0.4 },
            ]}
            onPress={() => setWarehouseId(w.id)}
          >
            <Text
              style={[
                styles.filterText,
                warehouseId === w.id && styles.activeFilterText,
              ]}
            >
              {w.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🧹 مسح الفلاتر */}
      <View style={{ alignItems: "center", marginBottom: 10 }}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearBtnText}>مسح الفلترة</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {selectedProductName !== "" && (
        <View style={styles.productHeaderBox}>
          <Text style={styles.productHeaderText}>{selectedProductName}</Text>
        </View>
      )}

      {data.length > 0 && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>الطرف</Text>
            <Text style={styles.headerCell}>منصرف</Text>
            <Text style={styles.headerCell}>وارد</Text>
            <Text style={styles.headerCell}>المخزن</Text>
            <Text style={styles.headerCell}>التاريخ</Text>
          </View>

          <FlatList
            data={data}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      )}

      {/* ================== صنف المودال ================== */}
      <Modal visible={productModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.productModalBox}>
            <Text style={styles.modalTitle}>اختر الصنف</Text>

            <TextInput
              placeholder="بحث عن صنف..."
              value={productSearch}
              onChangeText={(text) => {
                setProductSearch(text);
                setHighlightIndex(0);
              }}
              style={styles.modalSearchInput}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === "ArrowDown") {
                  setHighlightIndex((prev) =>
                    prev < filteredProducts.length - 1 ? prev + 1 : prev,
                  );
                }

                if (e.nativeEvent.key === "ArrowUp") {
                  setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
                }

                if (
                  e.nativeEvent.key === "Enter" &&
                  filteredProducts[highlightIndex]
                ) {
                  selectProduct(filteredProducts[highlightIndex]);
                }
              }}
            />

            <FlatList
              ref={listRef}
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 300 }}
              contentContainerStyle={{ paddingRight: 15 }}
              keyboardShouldPersistTaps="handled"
              renderItem={renderProductItem}
              getItemLayout={(_, index) => ({
                length: 50, // ارتفاع العنصر
                offset: 50 * index,
                index,
              })}
            />

            <Pressable
              onPress={() => setProductModalVisible(false)}
              style={styles.closeModalBtn}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 20, // 👈 المسافة تحت الهيدر
  },

  searchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  iosPickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tableContainer: {
    alignSelf: "center", // يخليه في النص
    width: "92%", // يتحكم في عرض الجدول
    maxWidth: 900, // شكل ممتاز على التابلت والويب
  },

  productModalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    elevation: 10,
  },
  dateFilterBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: "92%",
    maxWidth: 720,
    alignSelf: "center",

    backgroundColor: "#ffffff", // 👈 أبيض ثابت
    borderColor: "#e2e8f0", // 👈 رمادي فاتح
  },

  dateFilterTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    color: "#64748b", // 👈 رمادي نصّي ثابت
  },

  dateRow: {
    flexDirection: "row",

    gap: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  modalSearchInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  activeProductRow: {
    backgroundColor: "#e2e8f0",
  },

  productRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
  },

  productManufacturer: {
    fontSize: 11,
    color: "#64748b",
  },

  closeModalBtn: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: "#1e293b",
    borderRadius: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 170,
    height: 40,
    backgroundColor: "#fff",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    minWidth: 140,
  },

  clearBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  clearBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  modalBox: {
    backgroundColor: "#fdf7f7",
    padding: 16,
    borderRadius: 12,
    width: "85%",
  },
  modalBtn: {
    marginTop: 12,
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 10,
  },

  dateText: {
    fontSize: 13,
    color: "#0f172a",
  },

  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },

  activeFilterBtn: { backgroundColor: "#1e293b" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#1e293b" },
  activeFilterText: { color: "#fff" },

  productHeaderBox: {
    backgroundColor: "#e2e8f0",
    margin: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  productHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 8,
  },

  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },

  rowItem: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  cell: { flex: 1, textAlign: "center", fontSize: 12 },
  inCell: { color: "green", fontWeight: "bold" },
  outCell: { color: "red", fontWeight: "bold" },
  partyCell: { fontWeight: "bold" },

  webOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  webModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: 320,
  },
  webTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 12 },
  webInput: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    textAlign: "center",
  },
  calendarIcon: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
