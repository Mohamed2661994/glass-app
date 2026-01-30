import { useTheme } from "@/components/context/theme-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RetailInvoice() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const invoiceId = Number(id);

  const { colors, isDark } = useTheme();
  const branchId = 1; // مؤقتًا

  const [products, setProducts] = useState<any[]>([]);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const qtyRefs = useRef<{ [key: number]: TextInput | null }>({});
  const [loading, setLoading] = useState(false);
  const invoiceType = "retail";
  const [items, setItems] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [highlightProductId, setHighlightProductId] = useState<number | null>(
    null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<number | null>(
    null,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<TextInput | null>(null);

  const barcodeRef = useRef<TextInput | null>(null);
  const beepSound = useRef<Audio.Sound | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const animatedValues = useRef<{ [key: number]: Animated.Value }>({}).current;
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraAnim = useRef(new Animated.Value(0)).current;

  const [search, setSearch] = useState("");
  const [showMovementDropdown, setShowMovementDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [showNewInvoiceWebModal, setShowNewInvoiceWebModal] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [showCashTransferConfirm, setShowCashTransferConfirm] = useState(false);
  const [cashMessage, setCashMessage] = useState("");

  const [movementType, setMovementType] = useState<"sale" | "purchase">("sale");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const decreaseQty = (productId: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.product_id === productId && it.quantity > 1
          ? { ...it, quantity: it.quantity - 1 }
          : it,
      ),
    );
  };

  //دالة الباركود
  const handleBarcodeScan = async (scannedCode?: string) => {
    const code = scannedCode ?? barcode;
    if (!code.trim()) return;

    try {
      const { data: product } = await api.get(`/products/by-barcode/${code}`, {
        params: { invoice_type: invoiceType, movement_type: movementType },
      });

      if (!product) {
        setScanned(true);
        setScannerOpen(false);
        Alert.alert("تنبيه", "الباركود غير مسجل", [
          {
            text: "حسنًا",
            onPress: () => {
              setBarcode("");
              setScanned(false);
            },
          },
        ]);
        return;
      }

      await beepSound.current?.replayAsync();

      setItems((prev) => {
        const exists = prev.find((p) => p.product_id === product.id);

        if (exists) {
          setTimeout(() => {
            qtyRefs.current[product.id]?.focus();
          }, 150);

          return prev.map((p) =>
            p.product_id === product.id
              ? { ...p, quantity: p.quantity + 1 }
              : p,
          );
        }

        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            manufacturer: product.manufacturer,
            package: product.retail_package,
            price: product.price,
            quantity: 1,
            discount: product.discount_amount || 0,
          },
        ];
      });

      setTimeout(() => {
        qtyRefs.current[product.id]?.focus();
      }, 200);

      setBarcode("");
      setScanned(false);
      setTimeout(() => {
        barcodeRef.current?.focus();
      }, 150);
    } catch (err: any) {
      Alert.alert(
        "خطأ",
        err.response?.status === 404
          ? "الباركود غير مسجل"
          : "فشل قراءة الباركود",
      );
      setScanned(false);
    }
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

      const { data } = await api.get("/products", {
        params: {
          branch_id: branchId,
          invoice_type: invoiceType,
          movement_type: movementType,
        },
      });
      setProducts(data);

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("خطأ", "فشل تحميل الأصناف");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchInvoiceForEdit = async () => {
    if (!invoiceId || isNaN(invoiceId)) return;
    try {
      const { data } = await api.get(`/invoices/${invoiceId}/edit`);

      setCustomerName(data.customer_name || "");
      setCustomerPhone(data.customer_phone || "");
      setMovementType(data.movement_type);
      setInvoiceDate(new Date(data.invoice_date));

      setPaidAmount(String(data.paid_amount || ""));
      setPreviousBalance(String(data.previous_balance || ""));

      setExtraDiscount(Number(data.extra_discount || 0));
      setApplyDiscount(!!data.apply_items_discount);

      setItems(
        data.items.map((it: any) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          manufacturer: it.manufacturer,
          package: it.package,
          price: it.price,
          quantity: it.quantity,
          discount: it.discount || 0,
        })),
      );

      setLastInvoiceId(invoiceId);
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
      router.back();
    }
  };

  const addItem = (product: any) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.product_id === product.id);

      if (exists) {
        Alert.alert("تنبيه", "الصنف مضاف بالفعل في الفاتورة");
        setHighlightProductId(product.id);
        setTimeout(() => setHighlightProductId(null), 600);

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
          package: product.retail_package, // 👈
          price: product.price,
          quantity: 1,
          discount: product.discount_amount || 0,
        },
      ];
    });
    setShowProductModal(false);

    // فوكس على الكمية بعد الريندر
    setTimeout(() => {
      qtyRefs.current[product.id]?.focus();
    }, 300);
  };

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/sounds/beep-7.mp3"),
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

  const getUnitPrice = (it: any) => {
    return applyDiscount ? it.price - it.discount : it.price;
  };

  const getItemTotal = (it: any) => {
    return getUnitPrice(it) * it.quantity;
  };

  // 1️⃣ إجمالي قبل أي خصم
  const totalBeforeDiscount = items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0,
  );

  // 2️⃣ إجمالي خصم الأصناف (تلقائي)
  const itemsDiscount = applyDiscount
    ? items.reduce((sum, it) => sum + it.discount * it.quantity, 0)
    : 0;

  const totalAfterItemsDiscount = totalBeforeDiscount - itemsDiscount;

  const safeExtraDiscount = Math.min(extraDiscount, totalAfterItemsDiscount);

  const finalTotal = totalAfterItemsDiscount - safeExtraDiscount;
  const remaining =
    finalTotal + (Number(previousBalance) || 0) - (Number(paidAmount) || 0);

  const removeItem = (productId: number) => {
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

  const formatDate = (date: any): string => {
    if (!date) return "";

    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return "";

    return String(d.toLocaleDateString("ar-EG"));
  };

  // 👇 ده اللي هيتسجل حسب الاختيار

  const saveInvoice = async () => {
    try {
      await api.put(`/invoices/retail/${invoiceId}`, {
        branch_id: branchId,
        movement_type: movementType,
        invoice_date: invoiceDate.toISOString().split("T")[0],
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
        total_before_discount: totalBeforeDiscount,
        final_total: finalTotal,
        extra_discount: safeExtraDiscount,
        apply_items_discount: applyDiscount,
        paid_amount: Number(paidAmount) || 0,
        previous_balance: Number(previousBalance) || 0,
      });

      setSavedInvoiceNumber(invoiceId);
      setShowSuccessModal(true);
      setLastInvoiceId(invoiceId); // عشان الطباعة والترحيل
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل حفظ التعديلات");
    }
  };

  const transferToCashIn = async () => {
    try {
      const { data } = await api.post("/cash/in/from-invoice", {
        invoice_id: invoiceId,
      });

      setCashMessage(data.message);
    } catch (err: any) {
      Alert.alert("خطأ", err.response?.data?.error || "فشل ترحيل اليومية");
    } finally {
      setShowCashTransferConfirm(false);
      setShowSuccessModal(true);
    }
  };

  useEffect(() => {
    if (!id) return; // 👈 استنى لما id يوصل
    fetchInvoiceForEdit();
  }, [id]);

  useEffect(() => {
    console.log("CASH MODAL:", showCashTransferConfirm);
  }, [showCashTransferConfirm]);

  useEffect(() => {
    if (showProductModal) {
      setSelectedIndex(0);

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
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
    if (id === undefined) return; // لسه بيحمّل

    if (!id) {
      Alert.alert("خطأ", "هذه الصفحة مخصصة لتعديل فاتورة فقط");
      router.back();
    }
  }, [id]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "تعديل فاتورة معرض",

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

      <View style={{ flex: 1 }}>
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
                  style={{
                    color: colors.text,
                    textAlign: "center",
                    fontSize: 15,
                  }}
                >
                  🖨️ طباعة الفاتورة
                </Text>
              </Pressable>

              {/* رقم الفاتورة */}

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  رقم الفاتورة
                </Text>

                {/* الرقم مكان الخط */}
                <Text
                  style={{
                    color: "#22c55e",
                    fontSize: 14,
                    fontWeight: "700",
                    marginTop: 6, // نفس مكان الخط
                  }}
                >
                  #{invoiceId}
                </Text>
              </View>

              {/* نوع الفاتورة */}
              <Text style={{ color: colors.text }}>نوع الفاتورة</Text>
              <Text style={{ color: "#22c55e", marginBottom: 10 }}>قطاعي</Text>

              {/* نوع الحركة */}
              <Text style={{ color: colors.text, marginBottom: 6 }}>
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
                    backgroundColor: colors.border,

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
                      borderColor: colors.border,
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
                      <Text style={{ color: colors.text }}>بيع</Text>
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
                      <Text style={{ color: colors.text }}>شراء</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <Text style={{ color: colors.text, marginTop: 6 }}>التاريخ</Text>

              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  borderWidth: 1,
                }}
              >
                {/* التاريخ */}
                <Text style={{ color: colors.muted, fontSize: 15 }}>
                  {invoiceDate instanceof Date
                    ? invoiceDate.toLocaleDateString("ar-EG")
                    : ""}
                </Text>

                {/* أيقونة التقويم */}
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              </Pressable>

              {/* اسم العميل */}
              <Text style={{ color: colors.muted }}>اسم العميل</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="اكتب اسم العميل"
                placeholderTextColor="#6b7280"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                  textAlign: "right",
                  borderWidth: 1,
                }}
              />

              {/* رقم التليفون */}
              <Text style={{ color: colors.muted }}>رقم التليفون</Text>
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="01xxxxxxxxx"
                keyboardType="phone-pad"
                placeholderTextColor="#6b7280"
                style={{
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border,
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "right",
                  borderWidth: 1,
                }}
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 6 }}>
              الباركود
            </Text>

            <View
              style={{
                position: "relative",
                marginBottom: 16, // 👈 المسافة المطلوبة
              }}
            >
              <TextInput
                ref={barcodeRef}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="الباركود هنا"
                placeholderTextColor="#6b7280"
                onSubmitEditing={() => handleBarcodeScan()}
                style={[
                  styles.barcodeInput,
                  {
                    backgroundColor: colors.input,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border, // 👈 المفتاح
                  },
                ]}
              />

              {/* أيقونة الكاميرا */}
              {Platform.OS !== "web" && (
                <Pressable
                  onPress={async () => {
                    if (!permission?.granted) {
                      await requestPermission();
                    }

                    setScanned(false);
                    cameraAnim.setValue(0);
                    setScannerOpen(true);

                    Animated.timing(cameraAnim, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }).start();
                  }}
                  style={[
                    styles.cameraBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name="camera-outline" size={28} color="#22c55e" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => {
                setHighlightProductId(null);
                setShowProductModal(true);
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
                  color: colors.text,
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
                <Text
                  style={{ color: colors.text, fontSize: 18, marginBottom: 8 }}
                >
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
                        borderWidth: isExpanded ? 1 : 0,
                        borderColor: isExpanded
                          ? colors.primary
                          : colors.border,
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
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                            paddingLeft: 25,
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
                            onSubmitEditing={() => barcodeRef.current?.focus()}
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
                            }}
                          />
                        </View>

                        {/* السعر */}
                        <View
                          style={{ paddingLeft: 20, alignItems: "flex-start" }}
                        >
                          {applyDiscount && it.discount > 0 ? (
                            <>
                              <Text
                                style={{
                                  color: "#9ca3af",
                                  fontSize: 12,
                                  textDecorationLine: "line-through",
                                }}
                              >
                                {it.price}
                              </Text>
                              <Text
                                style={{ color: "#22c55e", fontWeight: "700" }}
                              >
                                {it.price - it.discount}
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={{ color: "#22c55e", fontWeight: "700" }}
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
                          marginTop: 2,
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
                              سعر الوحدة: {getUnitPrice(it)}
                            </Text>

                            <Text
                              style={{
                                color: "#60a5fa",
                                fontSize: 13,
                                textAlign: "right",
                              }}
                            >
                              إجمالي قبل الخصم: {it.price * it.quantity}
                            </Text>

                            <Text
                              style={{
                                color: "#60a5fa",
                                fontSize: 13,
                                textAlign: "right",
                              }}
                            >
                              إجمالي الصنف: {getItemTotal(it)}
                            </Text>

                            {applyDiscount && it.discount > 0 && (
                              <Text
                                style={{
                                  color: "#facc15",
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
                              {it.price * it.quantity -
                                it.discount * it.quantity}
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
                {itemsDiscount > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: colors.muted }}>خصم الأصناف</Text>
                    <Text style={{ color: "#22c55e" }}>- {itemsDiscount}</Text>
                  </View>
                )}

                {safeExtraDiscount > 0 && (
                  <View
                    style={{
                      paddingTop: 6,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: "#60a5fa" }}>خصم إضافي</Text>
                    <Text style={{ color: "#60a5fa" }}>
                      - {safeExtraDiscount}
                    </Text>
                  </View>
                )}

                {/* Checkbox */}
                <Pressable
                  onPress={() => setApplyDiscount((prev) => !prev)}
                  style={{
                    marginTop: 10, // 👈 مسافة من اللي فوق
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
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#020617" : "#f1f5f9",
                marginHorizontal: 20,
                borderRadius: 12,
                padding: 16,
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
                <Text style={{ color: colors.text, textAlign: "center" }}>
                  تم
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={scannerOpen} transparent animationType="none">
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: colors.input,
            opacity: cameraAnim,
            transform: [
              {
                scale: cameraAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          }}
        >
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "code128", "qr"],
            }}
            onBarcodeScanned={({ data }) => {
              if (scanned) return;

              setScanned(true);
              setBarcode(data);

              Animated.timing(cameraAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setScannerOpen(false);

                // نفس تأثير Enter
                handleBarcodeScan(data);
              });
            }}
          />

          {/* Overlay */}
          <View style={styles.scanOverlay}>
            <View style={styles.overlayRow} />
            <View style={styles.overlayCenter}>
              <View style={styles.overlaySide} />
              <View style={styles.scanBox} />
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayRow} />
          </View>

          {/* زر إغلاق */}
          <Pressable
            onPress={() => {
              Animated.timing(cameraAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setScannerOpen(false);
              });
            }}
            style={styles.closeScanBtn}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>إغلاق</Text>
          </Pressable>
        </Animated.View>
      </Modal>

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
                backgroundColor: "#2563eb",
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
                تم حفظ تعديل الفاتورة بنجاح
              </Text>
              <Text
                style={{
                  color: "#22c55e",
                  fontSize: 14,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                تم تحديث اليومية بنجاح
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
                  backgroundColor: "#2563eb",
                  width: "100%",
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
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
                <Text style={{ color: colors.text, textAlign: "center" }}>
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
            <ScrollView>
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
                      opacity:
                        movementType === "sale"
                          ? item.available_quantity > 0
                            ? 1
                            : 0.4
                          : 1,
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
      {console.log("CONFIRM MODAL:", showConfirmModal)}

      {showConfirmModal && (
        <Modal
          transparent
          animationType="fade"
          visible={showConfirmModal} // ✅ السطر المهم
          onRequestClose={() => setShowConfirmModal(false)}
        >
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
                        paddingVertical: 12,
                        borderRadius: 10,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: "#22c55e",
                          textAlign: "center",
                          fontWeight: "700",
                        }}
                      >
                        {itemsDiscount}
                      </Text>
                    </View>

                    <Text style={{ color: colors.text, marginBottom: 6 }}>
                      خصم إضافي على الفاتورة
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
                        borderColor: colors.border,
                        color: colors.text,
                        paddingVertical: 12,
                        borderRadius: 10,
                        marginBottom: 14,
                        textAlign: "center",
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
                      borderColor: colors.border,
                      color: colors.text,
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginBottom: 14,
                      textAlign: "center",
                    }}
                  />

                  {/* ===== المدفوع ===== */}
                  <Text style={{ color: colors.text, marginBottom: 6 }}>
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
                        backgroundColor: "#2563eb",
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
    </>
  );
}

const styles = StyleSheet.create({
  scanOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  overlayRow: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  overlayCenter: {
    flexDirection: "row",
  },

  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  scanBox: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: "#22c55e",
    borderRadius: 12,
  },

  closeScanBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#fff",
  },
  barcodeWrapper: {
    position: "relative",
    marginBottom: 16,
  },

  barcodeInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 54, // 👈 مساحة للأيقونة
    borderRadius: 12,
    textAlign: "center",
    fontSize: 16,
  },

  cameraBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -18 }],
    padding: 6,
    borderRadius: 20,
  },
});
