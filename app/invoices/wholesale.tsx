import { useTheme } from "@/components/context/theme-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import { Stack, router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function WholesaleInvoice() {
  const branchId = 2; // مؤقتًا

  const [products, setProducts] = useState<any[]>([]);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const qtyRefs = useRef<{ [key: number]: TextInput | null }>({});
  const [loading, setLoading] = useState(false);
  const invoiceType = "wholesale";
  const [items, setItems] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [highlightProductId, setHighlightProductId] = useState<number | null>(
    null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCashTransferConfirm, setShowCashTransferConfirm] = useState(false);
  const [cashMessage, setCashMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [customerPhones, setCustomerPhones] = useState<any[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);

  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<number | null>(
    null,
  );
  const [invoiceKey, setInvoiceKey] = useState(0);
  const barcodeRef = useRef<TextInput | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  const beepSound = useRef<Audio.Sound | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const animatedValues = useRef<{ [key: number]: Animated.Value }>({}).current;
  const discountRefs = useRef<{ [key: number]: TextInput | null }>({});
  const { colors, isDark } = useTheme();
  const [extraDiscount, setExtraDiscount] = useState(0);
  const addProductButtonRef = useRef<any>(null);
  const productScrollRef = useRef<ScrollView>(null);

  const [search, setSearch] = useState("");
  const [showMovementDropdown, setShowMovementDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [showNewInvoiceWebModal, setShowNewInvoiceWebModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneSearchResult, setPhoneSearchResult] = useState<any | null>(null);
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);

  const [movementType, setMovementType] = useState<"sale" | "purchase">("sale");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const formatDateForInput = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().split("T")[0];
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((p) =>
        `${p.name} ${p.manufacturer ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : [];

  const increaseQty = (productId: number, maxQty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.product_id === productId && it.quantity < maxQty
          ? { ...it, quantity: it.quantity + 1 }
          : it,
      ),
    );
  };
  const searchCustomerInsideModal = async (phone: string) => {
    setPhoneSearch(phone);
    setPhoneSearchResult(null);

    if (phone.length < 8) return;

    try {
      setPhoneSearchLoading(true);

      const res = await api.get("/customers/by-phone", {
        params: { phone },
      });
      if (res.data) {
        setPhoneSearchResult(res.data);
      }
    } catch (err) {
      console.log("Modal phone search error", err);
    } finally {
      setPhoneSearchLoading(false);
    }
  };
  const selectCustomerFromModal = (customer: any) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerId(customer.id);
    setPhoneModalVisible(false);
  };
  const useTypedPhone = () => {
    setCustomerPhone(phoneSearch);
    setPhoneModalVisible(false);
  };

  const searchCustomersByName = async (name: string) => {
    if (name.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const res = await api.get("/customers/search", {
        params: { name },
      });
      setCustomerSuggestions(res.data);

      setShowCustomerDropdown(true);
    } catch (err) {
      console.log("Customer search error", err);
    }
  };
  const searchCustomerByPhone = async (phone: string) => {
    if (phone.length < 8) return;

    try {
      const res = await api.get("/customers/by-phone", {
        params: { phone },
      });
      const data = res.data;

      if (data) {
        setCustomerName(data.name);
        setCustomerId(data.id); // ✅ مهم جدًا
      }
    } catch (err) {
      console.log("Phone search error", err);
    }
  };

  const decreaseQty = (productId: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.product_id === productId && it.quantity > 1
          ? { ...it, quantity: it.quantity - 1 }
          : it,
      ),
    );
  };

  const toggleExpand = (id: number) => {
    if (expandedItemId && expandedItemId !== id) {
      Animated.timing(animatedValues[expandedItemId], {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }

    const isOpen = expandedItemId === id;
    setExpandedItemId(isOpen ? null : id);

    Animated.timing(animatedValues[id], {
      toValue: isOpen ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/products", {
        params: {
          branch_id: branchId,
          invoice_type: invoiceType,
          movement_type: movementType,
        },
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert("خطأ", "فشل تحميل الأصناف");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const [isNewInvoice, setIsNewInvoice] = useState(false);

  const addItem = (product: any) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.product_id === product.id);

      if (exists) {
        Alert.alert("تنبيه", "الصنف مضاف بالفعل في الفاتورة");
        setHighlightProductId(product.id);
        setShowProductModal(false);

        setTimeout(() => {
          qtyRefs.current[product.id]?.focus();
          setHighlightProductId(null);
        }, 300);

        return prev; // 👈 مهم جدًا
      }

      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          manufacturer: product.manufacturer,
          package: product.wholesale_package, // ✅ هنا
          price: product.price,
          quantity: 1,
          discount: 0,
        },
      ];
    });
    setShowProductModal(false);

    // فوكس على الكمية بعد الريندر
    setTimeout(() => {
      qtyRefs.current[product.id]?.focus();
    }, 300);
  };

  const resetInvoice = () => {
    setItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaidAmount("");
    setPreviousBalance("");
    setApplyDiscount(false);

    setMovementType("sale");
    setShowMovementDropdown(false);

    setInvoiceDate(new Date());
    setSearch("");

    setHighlightProductId(null);
    setItemToDelete(null);

    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowProductModal(false);
    setShowDeleteModal(false);

    setLastInvoiceId(null);
    setSavedInvoiceNumber(null);
    setInvoiceKey((prev) => prev + 1);
  };

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep-7.mp3"),
        { shouldPlay: false },
      );
      beepSound.current = sound;
    };

    loadSound();

    return () => {
      beepSound.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [movementType]);

  const totalBeforeDiscount = items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0,
  );

  const itemsPriceAdjustment = items.reduce(
    (sum, it) => sum + Number(it.discount || 0) * it.quantity,
    0,
  );

  const appliedItemsAdjustment = applyDiscount ? itemsPriceAdjustment : 0;

  const safeExtraDiscount = Math.min(
    extraDiscount,
    totalBeforeDiscount - appliedItemsAdjustment,
  );

  const finalTotal =
    totalBeforeDiscount - appliedItemsAdjustment - safeExtraDiscount;

  // ================== DISCOUNTS LOGIC ==================

  const removeItem = (productId: number) => {
    delete animatedValues[productId];
    setItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  const confirmRemoveItem = (productId: number, productName: string) => {
    setItemToDelete({ id: productId, name: productName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = () => {
    if (!itemToDelete) return;

    removeItem(itemToDelete.id);

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const loadCustomerPhones = async () => {
    const res = await api.get(`/customers/${customerId}/phones`);
    setCustomerPhones(res.data);
  };
  const addPhoneToCustomer = async () => {
    await api.post(`/customers/${customerId}/phones`, {
      phone: newPhone,
    });

    setNewPhone("");
    loadCustomerPhones();
  };
  const formatDate = (date: any): string => {
    if (!date) return "";

    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return "";

    return String(d.toLocaleDateString("ar-EG"));
  };

  // 👇 ده اللي هيتسجل حسب الاختيار

  const totalWithPrevious = finalTotal + (Number(previousBalance) || 0);

  const remaining = totalWithPrevious - (Number(paidAmount) || 0);

  const saveInvoice = async () => {
    if (saving) return;

    if (items.length === 0) {
      Alert.alert("تنبيه", "لا يوجد أصناف في الفاتورة");
      return;
    }

    setSaving(true);

    try {
      const res = await api.post("/invoices", {
        invoice_type: "wholesale",
        movement_type: movementType,
        invoice_date: invoiceDate.toISOString(),
        customer_id: customerId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        apply_items_discount: applyDiscount,
        manual_discount: safeExtraDiscount,
        items,
        paid_amount: Number(paidAmount) || 0,
        previous_balance: Number(previousBalance) || 0,
      });

      setLastInvoiceId(res.data.invoice_id);
      setSavedInvoiceNumber(res.data.invoice_id);
      setShowCashTransferConfirm(true);
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل حفظ الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  const transferToCashIn = async () => {
    if (!lastInvoiceId) return;

    try {
      const res = await api.post("/cash/in/from-invoice", {
        invoice_id: lastInvoiceId,
      });

      // رسالة السيرفر
      setCashMessage(res.data.message || "تم الترحيل بنجاح");
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل ترحيل اليومية");
    } finally {
      setShowCashTransferConfirm(false);
      setShowSuccessModal(true);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerPhones();
    }
  }, [customerId]);

  useEffect(() => {
    if (isNewInvoice) {
      setIsNewInvoice(false);
    }
  }, [isNewInvoice]);

  useEffect(() => {
    if (showProductModal) {
      setSelectedIndex(0);
    }
  }, [showProductModal]);
  useEffect(() => {
    if (Platform.OS !== "web") return; // 👈 يمنع التنفيذ على الموبايل
    if (!showProductModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredProducts.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev,
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredProducts[selectedIndex];
        if (item) {
          addItem(item);
          setShowProductModal(false);
          setSearch("");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showProductModal, selectedIndex, filteredProducts]);

  useEffect(() => {
    if (!showProductModal) return;

    const ITEM_HEIGHT = 30; // عدل الرقم لو لزم
    const VISIBLE_OFFSET = 140; // يخلي العنصر في النص

    const y = selectedIndex * ITEM_HEIGHT - VISIBLE_OFFSET;

    productScrollRef.current?.scrollTo({
      y: y > 0 ? y : 0,
      animated: true,
    });
  }, [selectedIndex, showProductModal]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "فاتورة مخزن",

          // 👈 نخفي زر الرجوع الافتراضي
          headerBackVisible: false,

          // 👈 نعمل زر رجوع مخصص في الهيدر
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={26} color="#007aff" />
            </Pressable>
          ),

          headerTitleAlign: "center",
        }}
      />

      <View key={invoiceKey} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              padding: 16,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 720 : "100%",
              alignSelf: "center",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                color: colors.text,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              بيان فاتورة
            </Text>

            {lastInvoiceId && (
              <Pressable
                onPress={() => {
                  if (Platform.OS === "web") {
                    setShowNewInvoiceWebModal(true);
                  } else {
                    Alert.alert("فاتورة جديدة", "هل تريد بدء فاتورة جديدة؟", [
                      { text: "إلغاء", style: "cancel" },
                      {
                        text: "نعم",
                        onPress: () => resetInvoice(),
                      },
                    ]);
                  }
                }}
                style={{
                  backgroundColor: "#052d6dff",
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  🧾 فاتورة جديدة
                </Text>
              </Pressable>
            )}

            <View
              style={{
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Pressable
                disabled={!lastInvoiceId}
                onPress={() => {
                  router.push({
                    pathname: "/invoices/[id]/print",
                    params: { id: String(lastInvoiceId) },
                  });
                }}
                style={{
                  backgroundColor: lastInvoiceId ? "#16a34a" : "#1f2937",
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                  opacity: lastInvoiceId ? 1 : 0.5,
                }}
              >
                <Text
                  style={{ color: "#fff", textAlign: "center", fontSize: 15 }}
                >
                  🖨️ طباعة الفاتورة
                </Text>
              </Pressable>

              {/* رقم الفاتورة */}

              <Text style={{ color: "#9ca3af" }}>رقم الفاتورة</Text>
              <Text style={{ color: "#9ca3af", marginBottom: 10 }}>
                سيتم إنشاؤه تلقائيًا
              </Text>

              {/* نوع الفاتورة */}
              <Text style={{ color: "#9ca3af" }}>نوع الفاتورة</Text>
              <Text style={{ color: "#22c55e", marginBottom: 10 }}>جملة</Text>

              {/* نوع الحركة */}
              <Text style={{ color: "#9ca3af", marginBottom: 6 }}>
                نوع الحركة
              </Text>

              <View style={{ marginBottom: 12 }}>
                {/* زر فتح الدروب داون */}
                <Pressable
                  disabled={items.length > 0}
                  onPress={() => {
                    if (items.length > 0) {
                      Alert.alert(
                        "تنبيه",
                        "لا يمكن تغيير نوع الحركة بعد إضافة أصناف",
                      );
                      return;
                    }
                    setShowMovementDropdown((prev) => !prev);
                  }}
                  style={{
                    backgroundColor: colors.input,
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: items.length > 0 ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {movementType === "sale" ? "بيع" : "شراء"}
                  </Text>

                  <Ionicons
                    name={showMovementDropdown ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9ca3af"
                  />
                </Pressable>

                {/* القائمة نفسها */}
                {showMovementDropdown && items.length === 0 && (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 8,
                      marginTop: 4,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border, // 👈 المفتاح
                    }}
                  >
                    {/* بيع */}
                    <Pressable
                      onPress={() => {
                        setMovementType("sale");
                        setShowMovementDropdown(false);
                      }}
                      style={{
                        padding: 12,
                        backgroundColor:
                          movementType === "sale" ? "#22c55e" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            movementType === "sale"
                              ? "#fff" // مختار
                              : colors.text, // غير مختار
                        }}
                      >
                        بيع
                      </Text>
                    </Pressable>

                    {/* شراء */}
                    <Pressable
                      onPress={() => {
                        setMovementType("purchase");
                        setShowMovementDropdown(false);
                      }}
                      style={{
                        padding: 12,
                        backgroundColor:
                          movementType === "purchase"
                            ? "#22c55e"
                            : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            movementType === "purchase"
                              ? "#fff" // مختار
                              : colors.text, // غير مختار
                        }}
                      >
                        شراء
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <Text style={{ color: "#9ca3af", marginTop: 6 }}>التاريخ</Text>

              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: colors.input,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border, // 👈 المفتاح
                }}
              >
                {/* التاريخ */}
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {invoiceDate instanceof Date
                    ? invoiceDate.toLocaleDateString("ar-EG")
                    : ""}
                </Text>

                {/* أيقونة التقويم */}
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              </Pressable>

              {/* اسم العميل */}
              <Text style={{ color: "#9ca3af" }}>اسم العميل</Text>
              <TextInput
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  searchCustomersByName(text);
                }}
                onFocus={() => {
                  if (customerSuggestions.length > 0)
                    setShowCustomerDropdown(true);
                }}
                placeholder="اكتب اسم العميل"
                placeholderTextColor="#6b7280"
                style={{
                  backgroundColor: colors.input,
                  color: colors.text,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 4,
                  textAlign: "right",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              {showCustomerDropdown && customerSuggestions.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  {customerSuggestions.map((cust) => (
                    <Pressable
                      key={cust.id}
                      onPress={() => {
                        setCustomerName(cust.name);
                        setCustomerPhone(cust.phone || "");
                        setCustomerId(cust.id); // ✅ مهم
                        setShowCustomerDropdown(false);
                      }}
                      style={{
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={{ color: colors.text, textAlign: "right" }}>
                        {cust.name}
                      </Text>
                      {cust.phone && (
                        <Text
                          style={{
                            color: "#9ca3af",
                            fontSize: 12,
                            textAlign: "right",
                          }}
                        >
                          {cust.phone}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* رقم التليفون */}
              <Text style={{ color: "#9ca3af" }}>رقم التليفون</Text>

              <View style={{ position: "relative", marginBottom: 10 }}>
                <TextInput
                  value={customerPhone}
                  onChangeText={(text) => {
                    setCustomerPhone(text);
                    searchCustomerByPhone(text);
                  }}
                  placeholder="01xxxxxxxxx"
                  keyboardType="phone-pad"
                  placeholderTextColor="#6b7280"
                  style={{
                    backgroundColor: colors.input,
                    color: colors.text,
                    padding: 10,
                    borderRadius: 8,
                    textAlign: "right",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <Pressable
                  onPress={() => setPhoneModalVisible(true)}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: [{ translateY: -14 }],
                    //backgroundColor: "#16a34a",
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>➕</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              ref={addProductButtonRef}
              focusable={true} // 👈 مهم جدًا خصوصًا على Android / Web
              onPress={() => {
                setHighlightProductId(null);
                setShowProductModal(true);
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 150);
              }}
              style={{
                backgroundColor: "#16a34a",
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                + إضافة صنف
              </Text>
            </Pressable>

            {/* الأصناف المختارة */}
            {items.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>
                  الأصناف المختارة
                </Text>

                {items.map((it) => {
                  const product = products.find((p) => p.id === it.product_id);
                  const maxQty =
                    movementType === "sale"
                      ? product?.available_quantity || 1
                      : Infinity;

                  const remainingStock =
                    movementType === "sale"
                      ? Math.max(
                          (product?.available_quantity ?? 0) - it.quantity,
                          0,
                        )
                      : 0;

                  const isExpanded = expandedItemId === it.product_id;

                  if (!animatedValues[it.product_id]) {
                    animatedValues[it.product_id] = new Animated.Value(0);
                  }

                  const animatedStyle = {
                    opacity: animatedValues[it.product_id],
                    transform: [
                      {
                        scaleY: animatedValues[it.product_id],
                      },
                    ],
                  };

                  return (
                    <View
                      key={it.product_id}
                      style={{
                        backgroundColor:
                          highlightProductId === it.product_id
                            ? colors.primary
                            : colors.card,
                        padding: 14,
                        borderRadius: 14,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor:
                          highlightProductId === it.product_id
                            ? "#22c55e" // لما الصنف يتظلل بعد الإضافة
                            : isExpanded
                              ? colors.primary // لما الكارت مفتوح
                              : colors.border, // الوضع الطبيعي

                        // 👇 ظل خفيف يخلي الكارت بارز
                        shadowColor: "#000",
                        shadowOpacity: isDark ? 0.25 : 0.08,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2, // Android
                      }}
                    >
                      {/* ===== HEADER (دايمًا ظاهر) ===== */}
                      <View
                        style={{
                          flexDirection: "row",
                          // justifyContent: 'space-between',
                          alignItems: "center",
                        }}
                      >
                        {/* سهم */}
                        <Pressable
                          onPress={() => toggleExpand(it.product_id)}
                          hitSlop={10} // 👈 يخلي الضغط أسهل
                        >
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#94a3b8"
                            style={{ marginLeft: 10 }}
                          />
                        </Pressable>

                        {/* التحكم في الكمية (دايمًا شغال) */}
                        <View
                          style={{
                            paddingLeft: 25,
                          }}
                        >
                          {/* ===== صف الكمية ===== */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <TextInput
                              ref={(ref) => {
                                qtyRefs.current[it.product_id] = ref;
                              }}
                              value={String(it.quantity)}
                              keyboardType="numeric"
                              selectTextOnFocus
                              returnKeyType="done"
                              onSubmitEditing={() => {
                                discountRefs.current[it.product_id]?.focus();
                              }}
                              onChangeText={(val) => {
                                const num = Number(val);
                                if (!num || num < 1) return;
                                if (movementType === "sale" && num > maxQty) {
                                  Alert.alert("تنبيه", "الكمية أكبر من الرصيد");
                                  return;
                                }
                                setItems((prev) =>
                                  prev.map((p) =>
                                    p.product_id === it.product_id
                                      ? { ...p, quantity: num }
                                      : p,
                                  ),
                                );
                              }}
                              style={{
                                color: colors.text,
                                marginHorizontal: 10,
                                fontSize: 16,
                                minWidth: 40,
                                textAlign: "center",
                                backgroundColor: colors.background,
                                borderRadius: 6,
                                paddingVertical: 4,
                                borderColor: colors.border,
                                borderWidth: 1,
                              }}
                            />
                          </View>

                          {/* ===== الخصم (تحت الكمية – والكارت مقفول) ===== */}
                          {!isExpanded && (
                            <View style={{ marginTop: 6 }}>
                              <Text
                                style={{
                                  color: "#9ca3af",
                                  fontSize: 11,
                                  textAlign: "center",
                                  marginBottom: 2,
                                }}
                              >
                                خصم
                              </Text>

                              <TextInput
                                ref={(ref) => {
                                  discountRefs.current[it.product_id] = ref;
                                }}
                                value={String(it.discount || "")}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#6b7280"
                                onSubmitEditing={() => {
                                  addProductButtonRef.current?.focus();
                                }}
                                onChangeText={(val) => {
                                  if (val === "-" || val === "") {
                                    setItems((prev) =>
                                      prev.map((p) =>
                                        p.product_id === it.product_id
                                          ? { ...p, discount: val }
                                          : p,
                                      ),
                                    );
                                    return;
                                  }

                                  const num = Number(val);
                                  if (isNaN(num)) return;

                                  setItems((prev) =>
                                    prev.map((p) =>
                                      p.product_id === it.product_id
                                        ? { ...p, discount: num }
                                        : p,
                                    ),
                                  );
                                }}
                                style={{
                                  backgroundColor: colors.background,
                                  color: colors.text,
                                  marginHorizontal: 20,
                                  borderRadius: 6,
                                  paddingVertical: 4,
                                  minWidth: 40,
                                  textAlign: "center",
                                  fontSize: 13,
                                  borderColor: colors.border,
                                  borderWidth: 1,
                                }}
                              />
                            </View>
                          )}
                        </View>

                        {/* السعر */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {applyDiscount && Number(it.discount) !== 0 ? (
                            <>
                              {/* السعر قبل التعديل */}
                              <Text
                                style={{
                                  color: "#9ca3af",
                                  fontSize: 12,
                                  textDecorationLine: "line-through",
                                }}
                              >
                                {it.price}
                              </Text>

                              {/* السعر بعد التعديل */}
                              <Text
                                style={{
                                  color:
                                    it.discount > 0 ? "#22c55e" : "#f59e0b", // أخضر خصم / برتقالي زيادة
                                  fontWeight: "700",
                                  fontSize: 15,
                                }}
                              >
                                {it.price - Number(it.discount)}
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={{
                                color: "#22c55e",
                                fontWeight: "700",
                                fontSize: 15,
                              }}
                            >
                              {it.price}
                            </Text>
                          )}
                        </View>

                        {/* اسم الصنف + المصنع + فتح / قفل */}
                        <Pressable
                          onPress={() => toggleExpand(it.product_id)}
                          style={{ flex: 1, paddingRight: 8 }}
                        >
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 15,
                              textAlign: "right",
                              writingDirection: "rtl",
                              fontWeight: "600",
                            }}
                          >
                            {it.product_name}{" "}
                            <Text style={{ color: "#ce788bff" }}>
                              - {it.manufacturer}
                            </Text>
                          </Text>
                        </Pressable>
                      </View>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 12,
                          textAlign: "right",
                        }}
                      >
                        العبوة: {it.package}
                      </Text>
                      {/* ===== DETAILS (تظهر عند الفتح فقط) ===== */}
                      <Animated.View
                        style={[
                          {
                            overflow: "hidden",
                            marginTop: 12,
                          },
                          animatedStyle,
                        ]}
                      >
                        {isExpanded && (
                          <>
                            {movementType === "sale" && (
                              <Text
                                style={{
                                  color: colors.muted,
                                  fontSize: 12,
                                  textAlign: "right",
                                }}
                              >
                                الرصيد المتاح: {remainingStock}
                              </Text>
                            )}

                            <Text
                              style={{
                                color: colors.muted,
                                fontSize: 13,
                                textAlign: "right",
                              }}
                            >
                              سعر الوحدة: {it.price}
                            </Text>

                            <Text
                              style={{
                                color: "#9ca3af",
                                fontSize: 12,
                                textAlign: "right",
                              }}
                            >
                              خصم على الصنف
                            </Text>

                            <TextInput
                              ref={(ref) => {
                                discountRefs.current[it.product_id] = ref;
                              }}
                              value={String(it.discount || "")}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#6b7280"
                              onChangeText={(val) => {
                                const num = Number(val);
                                if (isNaN(num) || num < 0) return;

                                setItems((prev) =>
                                  prev.map((p) =>
                                    p.product_id === it.product_id
                                      ? { ...p, discount: num }
                                      : p,
                                  ),
                                );
                              }}
                              style={{
                                backgroundColor: colors.input,
                                color: colors.text,
                                borderColor: colors.border,
                                borderRadius: 6,
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                textAlign: "center",
                                fontSize: 13,
                                width: 70, // 👈 صغير
                                alignSelf: "flex-end", // 👈 يمين
                                marginBottom: 8,
                              }}
                            />

                            <Text
                              style={{
                                color: "#60a5fa",
                                fontSize: 13,
                                textAlign: "right",
                              }}
                            >
                              إجمالي الصنف:{" "}
                              {applyDiscount
                                ? (it.price - it.discount) * it.quantity
                                : it.price * it.quantity}
                            </Text>

                            {applyDiscount && it.discount > 0 && (
                              <Text
                                style={{
                                  color: colors.egmaly,
                                  fontSize: 13,
                                  textAlign: "right",
                                }}
                              >
                                إجمالي الخصم: {it.discount * it.quantity}
                              </Text>
                            )}

                            <Text
                              style={{
                                color: "#22c55e",
                                fontWeight: "600",
                                marginTop: 4,
                                textAlign: "right",
                              }}
                            >
                              الإجمالي بعد الخصم:{" "}
                              {applyDiscount
                                ? it.price * it.quantity -
                                  it.discount * it.quantity
                                : it.price * it.quantity}
                            </Text>

                            {/* مسح الصنف */}
                            <Pressable
                              onPress={() =>
                                confirmRemoveItem(
                                  it.product_id,
                                  it.product_name,
                                )
                              }
                              style={{
                                marginTop: 10,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#ef4444"
                              />
                              <Text
                                style={{
                                  color: "#ef4444",
                                  marginLeft: 4,
                                  fontSize: 13,
                                }}
                              >
                                مسح الصنف
                              </Text>
                            </Pressable>
                          </>
                        )}
                      </Animated.View>
                    </View>
                  );
                })}
              </View>
            )}

            {items.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.card,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* إجمالي قبل الخصم */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: colors.muted }}>إجمالي قبل الخصم</Text>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {totalBeforeDiscount}
                  </Text>
                </View>

                {/* الخصم */}
                {applyDiscount && appliedItemsAdjustment !== 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          appliedItemsAdjustment > 0 ? "#ef4444" : "#22c55e",
                      }}
                    >
                      خصم على أسعار الأصناف
                    </Text>

                    <Text
                      style={{
                        color:
                          appliedItemsAdjustment > 0 ? "#ef4444" : "#22c55e",
                        fontWeight: "600",
                      }}
                    >
                      {appliedItemsAdjustment > 0 ? "-" : "+"}{" "}
                      {Math.abs(appliedItemsAdjustment)}
                    </Text>
                  </View>
                )}

                {/* خصم إضافي على الفاتورة */}
                {extraDiscount > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: "#60a5fa" }}>خصم الفاتورة</Text>
                    <Text style={{ color: "#60a5fa" }}>- {extraDiscount}</Text>
                  </View>
                )}

                {/* Checkbox */}
                <Pressable
                  onPress={() => {
                    setApplyDiscount((prev) => {
                      const next = !prev;

                      return next;
                    });
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: "#22c55e",
                      backgroundColor: applyDiscount
                        ? "#22c55e"
                        : "transparent",
                      marginRight: 8,
                    }}
                  />

                  <Text style={{ color: colors.text }}>
                    حفظ الفاتورة بعد الخصم
                  </Text>
                </Pressable>

                {/* الإجمالي النهائي */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#22c55e",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    الإجمالي النهائي
                  </Text>

                  <Text
                    style={{
                      color: "#22c55e",
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                  >
                    {finalTotal}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (items.length === 0) {
                  Alert.alert("تنبيه", "لا يوجد أصناف في الفاتورة");
                  return;
                }

                if (!customerName.trim()) {
                  Alert.alert("تنبيه", "برجاء إدخال اسم العميل");
                  return;
                }

                setShowConfirmModal(true);
              }}
              style={{
                backgroundColor: colors.botmf,
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                حفظ الفاتورة
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* ANDROID */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={invoiceDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === "set" && selectedDate) {
              setInvoiceDate(selectedDate);
            }
          }}
        />
      )}

      {/* IOS */}
      {Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible={showDatePicker}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#020617" : "#f1f5f9",
                marginHorizontal: 20,
                borderRadius: 12,
                padding: 16,
                width: "90%",
                maxWidth: 360,
              }}
            >
              <DateTimePicker
                value={invoiceDate}
                mode="date"
                display="spinner"
                textColor={isDark ? "#e5e7eb" : "#020617"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setInvoiceDate(selectedDate);
                  }
                }}
              />

              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  تم
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* WEB DATE PICKER */}
      {Platform.OS === "web" && showDatePicker && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 16,
              width: 320,
              borderWidth: 1,
              borderColor: colors.border,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* العنوان */}
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              اختر التاريخ
            </Text>

            {/* input */}
            <View
              style={{
                backgroundColor: colors.input,
                borderRadius: 10,
                padding: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <input
                type="date"
                value={formatDateForInput(invoiceDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setInvoiceDate(newDate);
                  }
                }}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  color: colors.text,
                  border: "none",
                  outline: "none",
                  fontSize: 15,
                  textAlign: "center",
                }}
              />
            </View>

            {/* زرار */}
            <button
              onClick={() => setShowDatePicker(false)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                backgroundColor: colors.primary,
                color: colors.text,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              تم
            </button>
          </View>
        </View>
      )}

      {showDeleteModal && (
        <Modal transparent animationType="fade" visible={showDeleteModal}>
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
                width: "90%",
                maxWidth: 360,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* العنوان */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                تأكيد الحذف
              </Text>

              {/* النص */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                هل أنت متأكد من مسح الصنف:
                {"\n"}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {itemToDelete?.name}
                </Text>
              </Text>

              {/* الأزرار */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* إلغاء */}
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontSize: 15,
                    }}
                  >
                    إلغاء
                  </Text>
                </Pressable>

                {/* مسح */}
                <Pressable
                  onPress={handleDeleteConfirmed}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: "#dc2626",
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    مسح
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showConfirmModal && (
        <Modal transparent animationType="fade">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                  padding: 16,
                }}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 18,
                    padding: 18,
                    maxWidth: 420,
                    alignSelf: "center",
                    width: "100%",
                  }}
                >
                  {/* ===== العنوان ===== */}
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    تأكيد حفظ الفاتورة
                  </Text>

                  {/* ===== اسم العميل ===== */}
                  <Text style={{ color: colors.text, marginBottom: 6 }}>
                    اسم العميل
                  </Text>

                  <View
                    style={{
                      backgroundColor: colors.input,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, textAlign: "right" }}>
                      {customerName || "—"}
                    </Text>
                  </View>

                  {/* ===== ملخص ===== */}
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        marginBottom: 10,
                        textAlign: "center",
                      }}
                    >
                      إجمالي الفاتورة: {totalBeforeDiscount}
                    </Text>

                    <Text
                      style={{
                        color: "#9ca3af",
                        fontSize: 13,
                        textAlign: "center",
                        marginBottom: 6,
                      }}
                    >
                      خصم الأصناف (محسوب تلقائيًا)
                    </Text>

                    <View
                      style={{
                        backgroundColor: colors.input,
                        paddingVertical: 14,
                        borderRadius: 10,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {applyDiscount && appliedItemsAdjustment !== 0 ? (
                        <Text
                          style={{
                            color:
                              appliedItemsAdjustment > 0
                                ? "#ef4444"
                                : "#22c55e",
                            textAlign: "center",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {appliedItemsAdjustment > 0
                            ? "خصم أصناف"
                            : "زيادة أسعار أصناف"}
                          : {Math.abs(appliedItemsAdjustment)}
                        </Text>
                      ) : (
                        <Text
                          style={{
                            color: "#9ca3af",
                            textAlign: "center",
                            fontSize: 13,
                          }}
                        >
                          لا يوجد تعديل على الأصناف
                        </Text>
                      )}
                    </View>

                    {/* خصم إضافي */}
                    <Text style={{ color: colors.text, marginBottom: 6 }}>
                      خصم إضافي
                    </Text>

                    <TextInput
                      value={String(extraDiscount)}
                      onChangeText={(val) => {
                        const num = Number(val);
                        if (!isNaN(num) && num >= 0) {
                          setExtraDiscount(num);
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6b7280"
                      style={{
                        backgroundColor: colors.input,
                        color: colors.text,
                        paddingVertical: 12,
                        borderRadius: 10,
                        marginBottom: 14,
                        textAlign: "center",
                        borderWidth: 1,
                        borderColor: colors.border, // 👈 المفتاح
                      }}
                    />

                    <Text
                      style={{
                        color: "#22c55e",
                        fontWeight: "700",
                        fontSize: 16,
                        textAlign: "center",
                      }}
                    >
                      الإجمالي النهائي: {finalTotal}
                    </Text>
                  </View>

                  {/* ===== حساب سابق ===== */}
                  <Text style={{ color: colors.text, marginBottom: 6 }}>
                    حساب سابق
                  </Text>
                  <TextInput
                    value={previousBalance}
                    onChangeText={setPreviousBalance}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                    style={{
                      backgroundColor: colors.input,
                      color: colors.text,
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginBottom: 14,
                      textAlign: "center",
                      borderWidth: 1,
                      borderColor: colors.border, // 👈 المفتاح
                    }}
                  />

                  {/* ===== المدفوع ===== */}
                  <Text style={{ color: "#9ca3af", marginBottom: 6 }}>
                    المدفوع
                  </Text>
                  <TextInput
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                    style={{
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginBottom: 18,
                      textAlign: "center",
                      borderWidth: 1,
                    }}
                  />

                  {/* ===== المتبقي ===== */}
                  <Text
                    style={{
                      color: remaining > 0 ? "#ef4444" : "#22c55e",
                      fontWeight: "700",
                      fontSize: 16,
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    المتبقي: {remaining}
                  </Text>

                  {/* ===== الأزرار ===== */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={() => {
                        const hasUserInput =
                          Number(paidAmount) > 0 || Number(previousBalance) > 0;

                        if (!hasUserInput) {
                          // مفيش مدخلات → تصفير عادي
                          setPaidAmount("");
                          setPreviousBalance("");
                        }

                        // في كل الأحوال نقفل المودال
                        setShowConfirmModal(false);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        paddingVertical: 14,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: colors.text, textAlign: "center" }}>
                        إلغاء
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowConfirmModal(false);
                        saveInvoice();
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        paddingVertical: 14,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        حفظ
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
      {showCashTransferConfirm && (
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
                borderRadius: 18,
                padding: 22,
                width: "90%",
                maxWidth: 360,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                ترحيل إلى اليومية
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                هل تريد ترحيل الفاتورة إلى اليومية (الخزنة)؟
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setShowCashTransferConfirm(false);
                    setShowSuccessModal(true);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                  }}
                >
                  <Text style={{ color: colors.text, textAlign: "center" }}>
                    لا
                  </Text>
                </Pressable>

                <Pressable
                  onPress={transferToCashIn}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: "#16a34a",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    نعم
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showSuccessModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 24,
                width: "90%",
                maxWidth: 360,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* أيقونة */}
              <View
                style={{
                  backgroundColor: "#16a34a",
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons name="checkmark" size={36} color="#fff" />
              </View>

              {/* النص */}
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                تم حفظ الفاتورة بنجاح
              </Text>

              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 14,
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                رقم الفاتورة: {savedInvoiceNumber}
              </Text>
              {cashMessage !== "" && (
                <Text
                  style={{
                    color: "#22c55e",
                    fontSize: 13,
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  {cashMessage}
                </Text>
              )}

              {/* الأزرار */}
              <Pressable
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push({
                    pathname: "/invoices/[id]/print",
                    params: { id: String(savedInvoiceNumber) },
                  });
                }}
                style={{
                  backgroundColor: colors.primary,
                  width: "100%",
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  🖨️ طباعة الفاتورة
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowSuccessModal(false)}
                style={{
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#9ca3af", textAlign: "center" }}>
                  إغلاق
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {showProductModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,

              margin: 16,
              borderRadius: 16,
              maxHeight: "80%",
              width: "100%",
              maxWidth: Platform.OS === "web" ? 720 : "100%",
              alignSelf: "center",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 16,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18 }}>اختر صنف</Text>

              <Pressable onPress={() => setShowProductModal(false)}>
                <Text style={{ color: "#ef4444", fontSize: 16 }}>إغلاق</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                بحث
              </Text>

              <View
                style={{
                  backgroundColor: colors.input,
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TextInput
                  ref={searchInputRef}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="اكتب اسم الصنف..."
                  placeholderTextColor="#6b7280"
                  style={{
                    color: colors.text,
                    padding: 8,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>

            {/* List */}
            <ScrollView ref={productScrollRef}>
              {filteredProducts.map((item, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      addItem(item);
                      setShowProductModal(false);
                      setSearch("");
                    }}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#222",
                      backgroundColor: isSelected ? "#22c55e33" : "transparent",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: "#22c55e",
                    }}
                  >
                    <Text style={{ color: colors.text, marginBottom: 6 }}>
                      {item.name}{" "}
                      <Text style={{ color: "#ce788bff" }}>
                        - {item.manufacturer}
                      </Text>
                    </Text>

                    <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                      السعر: {item.price} | الرصيد: {item.available_quantity}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {Platform.OS === "web" && showNewInvoiceWebModal && (
        <View
          style={{
            position: "fixed",
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
              borderRadius: 16,
              padding: 24,
              width: 320,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              فاتورة جديدة
            </Text>

            <Text
              style={{
                color: "#9ca3af",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              هل تريد بدء فاتورة جديدة؟
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* إلغاء */}
              <Pressable
                onPress={() => setShowNewInvoiceWebModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#374151",
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  إلغاء
                </Text>
              </Pressable>

              {/* موافق */}
              <Pressable
                onPress={() => {
                  window.location.reload();
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
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
                  نعم
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      <Modal visible={phoneModalVisible} animationType="slide" transparent>
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
              width: "92%",
              maxWidth: 380,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}
            >
              بحث عن عميل برقم الهاتف
            </Text>

            <TextInput
              placeholder="اكتب رقم التليفون"
              value={phoneSearch}
              onChangeText={searchCustomerInsideModal}
              keyboardType="phone-pad"
              style={{
                backgroundColor: colors.input,
                color: colors.text,
                padding: 12,
                borderRadius: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
                textAlign: "right",
              }}
            />

            {phoneSearchLoading && (
              <Text style={{ color: "#9ca3af", textAlign: "center" }}>
                جاري البحث...
              </Text>
            )}

            {phoneSearchResult && (
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: "#16a34a11",
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#16a34a55",
                }}
              >
                {/* اسم العميل */}
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "700",
                    fontSize: 16,
                    textAlign: "right",
                    marginBottom: 8,
                  }}
                >
                  {phoneSearchResult.name}
                </Text>

                {/* أرقام العميل */}
                {phoneSearchResult.phones?.map((p: any, index: number) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setCustomerName(phoneSearchResult.name);
                      setCustomerPhone(p.phone);
                      setCustomerId(phoneSearchResult.id);
                      setPhoneModalVisible(false);
                    }}
                    style={{
                      backgroundColor: "#020617",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: "#16a34a",
                    }}
                  >
                    <Text style={{ color: "#22c55e", textAlign: "center" }}>
                      {p.phone}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {!phoneSearchResult &&
              phoneSearch.length >= 8 &&
              !phoneSearchLoading && (
                <Pressable
                  onPress={useTypedPhone}
                  style={{
                    backgroundColor: "#f59e0b22",
                    padding: 12,
                    borderRadius: 10,
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: "#f59e0b",
                  }}
                >
                  <Text style={{ color: colors.text, textAlign: "center" }}>
                    استخدام هذا الرقم للفاتورة
                  </Text>
                </Pressable>
              )}

            <Pressable
              onPress={() => setPhoneModalVisible(false)}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: "#ef4444", textAlign: "center" }}>
                إغلاق
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
