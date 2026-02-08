import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= Toast داخلي ================= */
function AppToast({
  message,
  type,
  onHide,
  styles,
}: {
  message: string;
  type: "success" | "error" | "info";
  onHide: () => void;
  styles: any;
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.toast, styles[type]]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}
/* ================================================= */
type ProductItem = {
  label: string;
  value: number;
  manufacturer?: string;
  wholesale_package?: string;
};

export default function ReplaceScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const router = useRouter();

  const [outProductId, setOutProductId] = useState<number | null>(null);
  const [outQuantity, setOutQuantity] = useState("");
  const [inProductId, setInProductId] = useState<number | null>(null);
  const [inQuantity, setInQuantity] = useState("");
  const [note, setNote] = useState("");
  const [outLiveQty, setOutLiveQty] = useState<number | null>(null);
  const [inLiveQty, setInLiveQty] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [openOut, setOpenOut] = useState(false);
  const [openIn, setOpenIn] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  /* تحميل الأصناف */
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data } = await api.get("/products/for-replace", {
        params: { branch_id: 2 },
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: "فشل تحميل الأصناف", type: "error" });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const productItems: ProductItem[] = products.map((p) => ({
    label: p.name,
    value: p.id,
    manufacturer: p.manufacturer,
    wholesale_package: p.wholesale_package,
  }));

  const getProductName = (id: number | null) =>
    products.find((p) => p.id === id)?.name || "";

  /* تنفيذ الاستبدال */
  const handleReplace = async () => {
    if (!outProductId || !inProductId || !outQuantity || !inQuantity) {
      setToast({ message: "من فضلك أكمل كل البيانات", type: "error" });
      return;
    }
    if (Number(outQuantity) <= 0 || Number(inQuantity) <= 0) {
      setToast({ message: "الكمية يجب أن تكون أكبر من صفر", type: "error" });
      return;
    }

    const available = outLiveQty;

    if (available !== null && Number(outQuantity) > available) {
      setToast({
        message: `الكمية أكبر من الرصيد (${available})`,
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await api.post("/stock/replace", {
        branch_id: 2,
        out_product_id: outProductId,
        out_quantity: Number(outQuantity),
        in_product_id: inProductId,
        in_quantity: Number(inQuantity),
        note,
      });

      if (data?.error) {
        setToast({ message: data.error, type: "error" });
        return;
      }

      setToast({ message: "تم الاستبدال بنجاح", type: "success" });
      await loadProducts();

      setOutProductId(null);
      setOutQuantity("");
      setInProductId(null);
      setInQuantity("");
      setNote("");
      // 🔄 إخفاء الرصيد المباشر
      setOutLiveQty(null);
      setInLiveQty(null);
      // 🔄 قفل القوائم
      setOpenOut(false);
      setOpenIn(false);
    } catch {
      setToast({ message: "فشل الاتصال بالسيرفر", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchLiveQuantity = async (
    productId: number,
    setQty: (v: number | null) => void,
  ) => {
    try {
      const { data } = await api.get("/stock/quantity", {
        params: { product_id: productId, branch_id: 2 },
      });
      setQty(data.quantity);
    } catch {
      setQty(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backCircle}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>

          <Text
            style={styles.headerTitleCentered}
            pointerEvents="none" // 👈 السطر السحري
          >
            استبدال مصنع
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.formWrapper}>
            {loadingProducts ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                {/* 🔴 الصنف المكسور */}
                <ThemedView style={[styles.card, { zIndex: 3000 }]}>
                  <ThemedText style={styles.cardTitle}>
                    الصنف المكسور
                  </ThemedText>

                  <DropDownPicker
                    open={openOut}
                    value={outProductId}
                    items={productItems}
                    setOpen={setOpenOut}
                    setValue={(callback) => {
                      const val = callback(outProductId);
                      setOutProductId(val);
                      if (val) fetchLiveQuantity(val, setOutLiveQty);
                    }}
                    searchable
                    searchPlaceholder="ابحث عن الصنف..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      showsVerticalScrollIndicator: false,
                    }}
                    maxHeight={400}
                    placeholder="اختر الصنف"
                    style={styles.dropdown}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      {
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                      },
                    ]}
                    textStyle={{ color: colors.text }}
                    searchTextInputStyle={styles.searchInput}
                    searchContainerStyle={styles.searchContainer}
                    /* 👇 عرض مخصص (اسم + مصنع + عبوة) */
                    renderListItem={({ item }) => {
                      const product = item as ProductItem;

                      return (
                        <Pressable
                          onPress={() => {
                            setOutProductId(product.value); // ✅ اختيار الصنف
                            setOpenOut(false); // ✅ قفل القائمة
                            fetchLiveQuantity(product.value, setOutLiveQty); // ✅ الرصيد
                          }}
                          style={({ pressed }) => ({
                            paddingVertical: 8,
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          {/* اسم الصنف */}
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            {product.label}
                          </Text>

                          {/* المصنع + العبوة */}
                          {(product.manufacturer ||
                            product.wholesale_package) && (
                            <Text
                              style={{
                                fontSize: 12,
                                marginTop: 2,
                                color: colors.muted,
                              }}
                            >
                              {product.manufacturer}
                              {product.manufacturer && product.wholesale_package
                                ? " | "
                                : ""}
                              {product.wholesale_package}
                            </Text>
                          )}
                        </Pressable>
                      );
                    }}
                  />

                  {outLiveQty !== null && (
                    <ThemedText style={styles.stockText}>
                      الرصيد الحالي : {outLiveQty}
                    </ThemedText>
                  )}

                  <TextInput
                    placeholder="الكمية"
                    placeholderTextColor="#888"
                    value={outQuantity}
                    onChangeText={setOutQuantity}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </ThemedView>

                {/* 🟢 الصنف البديل */}
                <ThemedView style={[styles.card, { zIndex: 2000 }]}>
                  <ThemedText style={styles.cardTitle}>الصنف البديل</ThemedText>

                  <DropDownPicker
                    open={openIn}
                    value={inProductId}
                    items={productItems}
                    setOpen={setOpenIn}
                    setValue={() => {}} // 👈 الحل السحري
                    multiple={false}
                    searchable
                    searchPlaceholder="ابحث عن الصنف..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      showsVerticalScrollIndicator: false,
                    }}
                    maxHeight={400}
                    placeholder="اختر الصنف"
                    style={styles.dropdown}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      {
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                      },
                    ]}
                    textStyle={{ color: colors.text }}
                    searchTextInputStyle={styles.searchInput}
                    searchContainerStyle={styles.searchContainer}
                    renderListItem={({ item }) => {
                      const product = item as ProductItem;

                      return (
                        <Pressable
                          onPress={() => {
                            setInProductId(product.value);
                            setOpenIn(false);
                            fetchLiveQuantity(product.value, setInLiveQty);
                          }}
                          style={({ pressed }) => ({
                            paddingVertical: 8,
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            {product.label}
                          </Text>

                          {(product.manufacturer ||
                            product.wholesale_package) && (
                            <Text
                              style={{
                                fontSize: 12,
                                marginTop: 2,
                                color: colors.muted,
                              }}
                            >
                              {product.manufacturer}
                              {product.manufacturer && product.wholesale_package
                                ? " | "
                                : ""}
                              {product.wholesale_package}
                            </Text>
                          )}
                        </Pressable>
                      );
                    }}
                  />

                  {inLiveQty !== null && (
                    <ThemedText style={styles.stockText}>
                      الرصيد الحالي : {inLiveQty}
                    </ThemedText>
                  )}

                  <TextInput
                    placeholder="الكمية"
                    placeholderTextColor="#888"
                    value={inQuantity}
                    onChangeText={setInQuantity}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </ThemedView>

                {/* 📝 ملاحظة */}
                <ThemedView style={styles.card}>
                  <ThemedText style={styles.cardTitle}>ملاحظة</ThemedText>
                  <TextInput
                    placeholder="ملاحظة (اختياري)"
                    placeholderTextColor="#888"
                    value={note}
                    onChangeText={setNote}
                    style={styles.input}
                  />
                </ThemedView>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setConfirmVisible(true)}
                  disabled={submitting}
                >
                  <ThemedText style={styles.buttonText}>
                    {submitting ? "جاري التنفيذ..." : "تنفيذ الاستبدال"}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {confirmVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ThemedText style={styles.modalTitle}>تأكيد الاستبدال</ThemedText>

              <Text style={styles.modalText}>
                هل أنت متأكد من استبدال{" "}
                <Text style={styles.bold}>{getProductName(outProductId)}</Text>{" "}
                بكمية <Text style={styles.bold}>{outQuantity}</Text> بالصنف{" "}
                <Text style={styles.bold}>{getProductName(inProductId)}</Text>{" "}
                بكمية <Text style={styles.bold}>{inQuantity}</Text>؟
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={styles.modalBtnText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn]}
                  onPress={() => {
                    setConfirmVisible(false);
                    handleReplace();
                  }}
                >
                  <Text style={styles.modalBtnText}>تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {toast && (
          <AppToast
            message={toast.message}
            type={toast.type}
            styles={styles}
            onHide={() => setToast(null)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= Styles ================= */
export const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 70,
      paddingBottom: 40,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 18,
      marginBottom: 16,
      borderWidth: Platform.OS === "web" ? 1 : 0,
      borderColor: colors.border,
    },

    cardTitle: {
      marginBottom: 10,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },

    stockText: {
      marginTop: 6,
      color: colors.muted,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
      color: colors.text,
      backgroundColor: colors.input,
    },

    dropdown: {
      backgroundColor: colors.input,
      borderColor: colors.border,
    },

    page: {
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: 40,
      backgroundColor: colors.background,
    },

    formWrapper: {
      width: "100%",
      maxWidth: 520,
      paddingHorizontal: 16,
    },

    dropdownContainer: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },

    searchInput: {
      color: colors.text,
      borderColor: colors.border,
    },

    searchContainer: {
      borderBottomColor: colors.border,
    },

    button: {
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      width: "100%",
    },

    buttonText: {
      color: colors.textOnPrimary ?? "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

    toast: {
      position: "absolute",
      top: 60,
      alignSelf: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      zIndex: 9999,
    },

    toastText: {
      color: "#fff",
      fontWeight: "600",
    },

    success: {
      backgroundColor: colors.success,
    },

    error: {
      backgroundColor: colors.danger,
    },

    info: {
      backgroundColor: colors.primary,
    },

    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },

    modalBox: {
      width: "90%",
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },

    backCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitleCentered: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      color: colors.text,
      fontSize: 17,
      fontWeight: "600",
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center",
      color: colors.text,
    },

    modalText: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 20,
    },

    bold: {
      color: colors.text,
      fontWeight: "700",
    },

    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },

    modalBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },

    cancelBtn: {
      backgroundColor: colors.surface ?? colors.border,
    },

    confirmBtn: {
      backgroundColor: colors.success,
    },

    modalBtnText: {
      color: "#fff",
      fontWeight: "700",
    },
  });
