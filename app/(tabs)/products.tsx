import { useTheme } from "@/components/context/theme-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import WebLayout from "@/components/layouts/WebLayout";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type Product = {
  id: number;
  name: string;
  wholesale_package: string;
  retail_package: string;
  manufacturer: string | null; // 👈 السطر المهم
  barcode: string | null; // 👈 السطر المهم
  purchase_price: number;
  retail_purchase_price: number; // 👈 جديد
  wholesale_price: number;
  retail_price: number;
  discount_amount: number;
  is_active: boolean;
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [retailPurchasePrice, setRetailPurchasePrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const barcodeInputRef = useRef<TextInput>(null);
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [wholesalePackage, setWholesalePackage] = useState("");
  const [retailPackage, setRetailPackage] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [webRefreshing, setWebRefreshing] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [activeEditId, setActiveEditId] = useState<number | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCopies, setPrintCopies] = useState("1");
  const [printProduct, setPrintProduct] = useState<Product | null>(null);

  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= Load Products ================= */
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/products");
      setProducts(res.data);
      setFiltered(res.data);
    } catch {
      alert("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* ================= Search ================= */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
      return;
    }

    const q = search.toLowerCase();

    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(q)),
      ),
    );
  }, [search, products]);

  /* ================= Barcode ================= */
  const generateBarcode = (id: number) => {
    return `900000${id}`;
  };

  /* ================= Save / Update ================= */
  const handleSave = async () => {
    if (
      !name.trim() ||
      !wholesalePackage.trim() ||
      !retailPackage.trim() ||
      !purchasePrice ||
      !wholesalePrice ||
      !retailPrice
    ) {
      alert("من فضلك أكمل كل البيانات المطلوبة");
      return;
    }

    const finalBarcode = barcode.trim() ? barcode.trim() : null;

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, {
          name,
          wholesale_package: wholesalePackage,
          retail_package: retailPackage,
          manufacturer,
          barcode: finalBarcode,
          purchase_price: Number(purchasePrice),
          retail_purchase_price: Number(retailPurchasePrice),
          wholesale_price: Number(wholesalePrice),
          retail_price: Number(retailPrice),
          discount_amount: Number(discount || 0),
        });
      } else {
        await api.post("/admin/products", {
          name,
          wholesale_package: wholesalePackage,
          retail_package: retailPackage,
          manufacturer,
          barcode: finalBarcode,
          purchase_price: Number(purchasePrice),
          retail_purchase_price: Number(retailPurchasePrice),
          wholesale_price: Number(wholesalePrice),
          retail_price: Number(retailPrice),
          discount_amount: Number(discount || 0),
        });
      }

      await loadProducts();
      resetForm();
      setActiveEditId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const openScanner = () => {
    setScanned(false);
    setScannerOpen(true);
  };

  /* ================= Edit ================= */
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setWholesalePackage(product.wholesale_package);
    setRetailPackage(product.retail_package);
    setBarcode(product.barcode || "");
    setManufacturer(product.manufacturer || "");
    setPurchasePrice(String(product.purchase_price));
    setRetailPurchasePrice(String(product.retail_purchase_price || ""));
    setWholesalePrice(String(product.wholesale_price));
    setRetailPrice(String(product.retail_price));
    setDiscount(String(product.discount_amount || ""));
    setActiveEditId(product.id);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setActiveEditId(null); // 👈 هنا
    setName("");
    setWholesalePackage("");
    setRetailPackage("");
    setManufacturer("");
    setRetailPurchasePrice("");
    setBarcode("");
    setPurchasePrice("");
    setWholesalePrice("");
    setRetailPrice("");
    setDiscount("");
  };

  const resetPrintModal = () => {
    setPrintModalOpen(false);
    setPrintCopies("1");
    setPrintProduct(null);
  };

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/sounds/beep-7.mp3"),
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log("Beep error:", e);
    }
  };

  /* ================= Content ================= */

  const Content = (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedText
        style={[styles.pageTitle, { color: colors.text }]}
        type="title"
      >
        إدارة الأصناف
      </ThemedText>

      {Platform.OS === "web" && webRefreshing && (
        <View style={{ marginBottom: 12 }}>
          <ActivityIndicator size="small" />
        </View>
      )}

      {/* ===== Web Row (Form + List) ===== */}
      <View style={styles.webRow}>
        {/* ===== Add / Edit ===== */}
        <ThemedView
          style={[
            styles.card,
            editingId !== null && styles.editingCard,

            {
              backgroundColor: colors.card,
              flexShrink: 0,
              alignSelf: "flex-start",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.cardTitle,
              editingId !== null
                ? { color: "#ffc415" }
                : { color: colors.text },
            ]}
          >
            {editingId ? "تعديل صنف" : "إضافة صنف جديد"}
          </ThemedText>

          <View style={styles.inputWrapper}>
            <TextInput
              ref={barcodeInputRef}
              placeholder="الباركود (اختياري)"
              placeholderTextColor="#888"
              value={barcode}
              editable={!editingId}
              onChangeText={setBarcode}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.text,
                  paddingEnd: Platform.OS !== "web" ? 90 : 12, // 👈 مساحة للأيقونات
                },
              ]}
              onSubmitEditing={() => nameInputRef.current?.focus()}
            />

            {/* توليد باركود (في حالة التعديل فقط) */}
            {editingId && !barcode && (
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { end: Platform.OS !== "web" ? 48 : 12 },
                ]}
                onPress={() => setBarcode(`900000${editingId}`)}
              >
                <Ionicons name="barcode-outline" size={20} color="#ed4b2f" />
              </TouchableOpacity>
            )}

            {/* كاميرا (موبايل فقط) */}
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={[styles.iconButton, { end: 12 }]}
                onPress={async () => {
                  if (!permission?.granted) {
                    await requestPermission();
                  }
                  setScannerOpen(true);
                }}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            ref={nameInputRef}
            placeholder="اسم الصنف"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="المصنع"
            placeholderTextColor="#888"
            value={manufacturer}
            onChangeText={setManufacturer}
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="عبوة الجملة (مثال: كرتونة 4 دستة)"
            placeholderTextColor="#888"
            value={wholesalePackage}
            onChangeText={setWholesalePackage}
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="عبوة القطاعي (مثال: شيالة 6 / طقم)"
            placeholderTextColor="#888"
            value={retailPackage}
            onChangeText={setRetailPackage}
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="سعر الشراء جملة"
            placeholderTextColor="#888"
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="سعر البيع جملة"
            placeholderTextColor="#888"
            value={wholesalePrice}
            onChangeText={setWholesalePrice}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="سعر الشراء قطاعي"
            placeholderTextColor="#888"
            value={retailPurchasePrice}
            onChangeText={setRetailPurchasePrice}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="سعر البيع قطاعي"
            placeholderTextColor="#888"
            value={retailPrice}
            onChangeText={setRetailPrice}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="خصم ثابت (اختياري)"
            placeholderTextColor="#888"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.buttonText}>
              {saving
                ? "جاري الحفظ..."
                : editingId
                  ? "تعديل الصنف"
                  : "حفظ الصنف"}
            </ThemedText>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity onPress={resetForm}>
              <ThemedText style={[styles.cancelText, { color: colors.text }]}>
                إلغاء التعديل
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* ===== List ===== */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              flex: 1,
              minHeight: 0,
              alignSelf: "stretch",
              ...(Platform.OS === "web" && {
                maxWidth: 820, // 👈 عرض مناسب لليست
              }),
            }, // 👈 مهم عشان ياخد الطول
          ]}
        >
          <ThemedText style={{ color: colors.text, marginBottom: 8 }}>
            قائمة الأصناف
          </ThemedText>

          <TextInput
            placeholder="بحث عن صنف..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
                marginBottom: 10,
              },
            ]}
          />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              Platform.OS !== "web" ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#2f80ed"
                />
              ) : undefined
            }
          >
            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : filtered.length === 0 ? (
              <ThemedText
                style={{
                  color: colors.muted,
                  textAlign: "center",
                  marginTop: 30,
                }}
              >
                لا توجد أصناف
              </ThemedText>
            ) : (
              <View style={styles.grid}>
                {filtered.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      activeEditId === item.id && {
                        borderColor: "#f2c94c",
                      },
                    ]}
                  >
                    {/* ===== Switch ===== */}
                    {Platform.OS === "web" ? (
                      <TouchableOpacity
                        onPress={async () => {
                          const value = !item.is_active;

                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === item.id ? { ...p, is_active: value } : p,
                            ),
                          );

                          try {
                            await api.put(`/admin/products/${item.id}/toggle`, {
                              is_active: value,
                            });
                          } catch {
                            setProducts((prev) =>
                              prev.map((p) =>
                                p.id === item.id
                                  ? { ...p, is_active: !value }
                                  : p,
                              ),
                            );
                          }
                        }}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: item.is_active
                            ? colors.primary || "#0822b6"
                            : isDark
                              ? "#555"
                              : "#ccc",
                          padding: 2,
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: item.is_active
                              ? "#ffffff"
                              : "#e5e7eb",
                            transform: [
                              { translateX: item.is_active ? 20 : 0 },
                            ],
                          }}
                        />
                      </TouchableOpacity>
                    ) : (
                      <Switch
                        value={item.is_active}
                        trackColor={{
                          false: isDark ? "#555" : "#ccc",
                          true: "#0822b6",
                        }}
                        thumbColor={item.is_active ? "#ffffff" : "#f4f4f5"}
                        onValueChange={async (value) => {
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === item.id ? { ...p, is_active: value } : p,
                            ),
                          );

                          try {
                            await api.put(`/admin/products/${item.id}/toggle`, {
                              is_active: value,
                            });
                          } catch {
                            setProducts((prev) =>
                              prev.map((p) =>
                                p.id === item.id
                                  ? { ...p, is_active: !value }
                                  : p,
                              ),
                            );
                          }
                        }}
                      />
                    )}

                    {/* ===== Product Info ===== */}
                    <View style={styles.productInfo}>
                      {/* الاسم */}
                      <View style={styles.infoGroup}>
                        <ThemedText
                          style={{ color: colors.muted, fontSize: 12 }}
                        >
                          الاسم
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.productName,
                            { color: colors.text },
                            !item.is_active && styles.inactiveText,
                          ]}
                        >
                          {item.name}
                        </ThemedText>
                      </View>

                      {/* المصنع */}
                      {item.manufacturer && (
                        <View style={styles.infoGroup}>
                          <ThemedText
                            style={{ color: colors.muted, fontSize: 12 }}
                          >
                            المصنع
                          </ThemedText>
                          <ThemedText style={{ color: colors.text }}>
                            {item.manufacturer}
                          </ThemedText>
                        </View>
                      )}

                      {/* الباركود */}
                      {item.barcode && (
                        <View style={styles.barcodeRow}>
                          <ThemedText style={styles.barcodeText}>
                            {item.barcode}
                          </ThemedText>

                          <View style={styles.barcodeActions}>
                            {/* طباعة */}
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: colors.botmta },
                              ]}
                              onPress={() => {
                                setPrintCopies("1");
                                setPrintProduct(item);
                                setPrintModalOpen(true);
                              }}
                            >
                              <Ionicons
                                name="print-outline"
                                size={16}
                                color="#fff"
                              />
                            </TouchableOpacity>

                            {/* نسخ */}
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                { backgroundColor: colors.botmbar },
                              ]}
                              onPress={async () => {
                                await Clipboard.setStringAsync(
                                  item.barcode as string,
                                );
                                alert("تم نسخ الباركود");
                              }}
                            >
                              <Ionicons
                                name="copy-outline"
                                size={16}
                                color="#2f80ed"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* العبوة */}
                      <View style={styles.infoGroup}>
                        <ThemedText
                          style={{ color: colors.muted, fontSize: 12 }}
                        >
                          العبوة
                        </ThemedText>
                        <ThemedText style={{ color: colors.text }}>
                          جملة: {item.wholesale_package}
                        </ThemedText>
                        <ThemedText style={{ color: colors.text }}>
                          قطاعي: {item.retail_package}
                        </ThemedText>
                      </View>

                      {/* الأسعار */}
                      <View style={styles.infoGroup}>
                        <ThemedText
                          style={{ color: colors.muted, fontSize: 12 }}
                        >
                          الأسعار
                        </ThemedText>

                        {/* ===== جملة ===== */}
                        <ThemedText style={{ color: colors.text }}>
                          شراء جملة: {item.purchase_price}
                        </ThemedText>
                        <ThemedText style={{ color: colors.text }}>
                          بيع جملة: {item.wholesale_price}
                        </ThemedText>

                        {/* ===== Divider ===== */}
                        <View
                          style={{
                            height: 1,
                            backgroundColor: colors.divider,
                            marginVertical: 6,
                            alignSelf: "stretch",
                          }}
                        />

                        {/* ===== قطاعي ===== */}
                        <ThemedText style={{ color: colors.text }}>
                          شراء قطاعي: {item.retail_purchase_price}
                        </ThemedText>
                        <ThemedText style={{ color: colors.text }}>
                          بيع قطاعي: {item.retail_price}
                        </ThemedText>
                      </View>

                      {/* الخصم */}
                      <View style={styles.infoGroup}>
                        <ThemedText
                          style={{ color: colors.muted, fontSize: 12 }}
                        >
                          الخصم
                        </ThemedText>
                        <ThemedText style={{ color: colors.text }}>
                          {item.discount_amount}
                        </ThemedText>
                      </View>

                      {!item.is_active && (
                        <ThemedText style={styles.inactiveLabel}>
                          (صنف موقوف)
                        </ThemedText>
                      )}
                    </View>

                    {/* ===== Edit ===== */}
                    <TouchableOpacity
                      disabled={!item.is_active}
                      onPress={() => handleEdit(item)}
                    >
                      <ThemedText
                        style={[
                          styles.editText,
                          { color: colors.botmta },
                          !item.is_active && styles.editDisabled,
                        ]}
                      >
                        تعديل
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </ThemedView>
      </View>
    </View>
  );

  return Platform.OS === "web" ? (
    <WebLayout>
      <View style={{ flex: 1 }} pointerEvents="box-none">
        {Content}
        {printModalOpen && (
          <Modal
            visible={printModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setPrintModalOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  طباعة باركود
                </ThemedText>

                <TextInput
                  placeholder="عدد النسخ"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={printCopies}
                  onChangeText={setPrintCopies}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                      marginBottom: 18,
                    },
                  ]}
                />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* إلغاء */}
                  <TouchableOpacity
                    style={[
                      styles.modalCancel,
                      {
                        backgroundColor: colors.border,
                      },
                    ]}
                    onPress={resetPrintModal}
                  >
                    <ThemedText style={{ color: colors.text }}>
                      إلغاء
                    </ThemedText>
                  </TouchableOpacity>

                  {/* طباعة */}
                  <TouchableOpacity
                    style={[
                      styles.modalConfirm,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      if (!printProduct) return;

                      router.push({
                        pathname: "/print/barcode",
                        params: {
                          barcode: printProduct.barcode,
                          copies: printCopies,
                          retailPrice: String(printProduct.retail_price),
                          discount: String(printProduct.discount_amount),
                          itemName: printProduct.name,
                        },
                      });

                      resetPrintModal(); // 👈 تصفير المودال
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                      طباعة
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </WebLayout>
  ) : (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {Content}
      {printModalOpen && (
        <Modal
          visible={printModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPrintModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                },
              ]}
            >
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                طباعة باركود
              </ThemedText>

              <TextInput
                placeholder="عدد النسخ"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={printCopies}
                onChangeText={setPrintCopies}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                    marginBottom: 18,
                  },
                ]}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* إلغاء */}
                <TouchableOpacity
                  style={[
                    styles.modalCancel,
                    {
                      backgroundColor: colors.border,
                    },
                  ]}
                  onPress={resetPrintModal}
                >
                  <ThemedText style={{ color: colors.text }}>إلغاء</ThemedText>
                </TouchableOpacity>

                {/* طباعة */}
                <TouchableOpacity
                  style={[
                    styles.modalConfirm,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    if (!printProduct) return;

                    router.push({
                      pathname: "/print/barcode",
                      params: {
                        barcode: printProduct.barcode,
                        copies: printCopies,
                        retailPrice: String(printProduct.retail_price),
                        discount: String(printProduct.discount_amount),
                      },
                    });

                    resetPrintModal(); // 👈 تصفير المودال
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    طباعة
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <Modal visible={scannerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "code128", "qr"],
            }}
            onBarcodeScanned={async ({ data }) => {
              if (scanned) return;

              setScanned(true);
              await playBeep(); // 🔊 الصوت
              setBarcode(data); // حفظ الباركود
              setScannerOpen(false); // قفل الكاميرا
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
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 40,
              alignSelf: "center",
              backgroundColor: "#000",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#fff",
            }}
            onPress={() => setScannerOpen(false)}
          >
            <ThemedText style={{ color: "#fff", fontSize: 14 }}>
              إغلاق
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ================= Styles ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },

  card: {
    borderRadius: 12,
    padding: 16,
    //alignSelf: "flex-start", // 👈 المهم جدًا
    gap: 10,
    ...(Platform.OS === "web"
      ? {
          width: 400, // 👈 للفورم
        }
      : {
          width: "100%", // 👈 للموبيل
        }),
  },
  editingCard: {
    borderColor: "#f2c94c",
    borderWidth: 2,
  },
  listCard: {
    borderRadius: 12,
    padding: 7,

    ...(Platform.OS === "web"
      ? {
          width: 760, // 👈 هنا الليست بس
        }
      : {
          width: "100%",
        }),
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  infoGroup: {
    marginBottom: 6,
  },
  barcodeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  barcodeText: {
    fontSize: 13,
    color: "#8aa4ff",
    flexShrink: 1,
  },

  barcodeActions: {
    flexDirection: "row-reverse",
    gap: 10,
  },

  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    backgroundColor: "#2f80ed",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontWeight: "bold",
  },
  cancelText: {
    textAlign: "center",
    marginTop: 10,
  },

  inputWrapper: {
    position: "relative",
    width: "100%",
  },

  inputWithIcon: {
    height: 48, // 👈 نفس الارتفاع بالظبط
    borderWidth: 1,
    borderRadius: 10,
    paddingStart: 12,
    paddingEnd: 44, // 👈 مساحة الأيقونة
    paddingVertical: 0,
  },

  listContent: {
    gap: 14, // 👈 المسافة بين البحث والكروت
    marginTop: 4, // 👈 يفصلهم عن العنوان
  },

  iconButton: {
    position: "absolute",
    end: 12,
    top: 0,
    height: 48, // 👈 نفس ارتفاع الـ input
    justifyContent: "center",
    alignItems: "center",
  },

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
    borderColor: "#2f80ed",
    borderRadius: 12,
    backgroundColor: "transparent",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: Platform.OS === "web" ? 360 : "90%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 20,
    elevation: 6, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },

  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  /* ===== Grid ===== */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    //justifyContent: 'flex-start',
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderWidth: 1,

    borderRadius: 10,

    ...(Platform.OS === "web"
      ? { width: "calc(50% - 6px)" as any } // 👈 توزيع مظبوط
      : { width: "100%" }),
  },

  productInfo: {
    flex: 1,
    gap: 4,
    paddingHorizontal: Platform.OS === "web" ? 6 : 0,
    alignItems: "flex-end", // 👈 يخلي المحتوى يبدأ من اليمين
  },

  productName: {
    fontSize: 16,
    fontWeight: "700",
    flexWrap: "wrap",
    writingDirection: "rtl",
  },

  subText: {
    fontSize: 12,
    flexWrap: "wrap",
    writingDirection: "rtl",
  },

  editText: {
    color: "#2f80ed",
    fontWeight: "600",
  },
  editDisabled: {
    color: "#555",
  },
  inactiveText: {
    color: "#777",
    textDecorationLine: "line-through",
  },
  inactiveLabel: {
    fontSize: 11,
    color: "#e74c3c",
  },

  pageTitle: {
    marginTop: Platform.OS === "web" ? 30 : 55, // 👈 مسافة من فوق في الويب
    marginBottom: 12,
    textAlign: "center",
  },

  webRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 24,

    ...(Platform.OS === "web" && {
      maxWidth: 1400, // 👈 عرض أكبر شوية
      width: "100%",
      alignSelf: "center", // 👈 يخلي الصف كله في نص الشاشة
      justifyContent: "center",
      alignItems: "stretch", // 👈 يخلي الكروت تاخد نفس الارتفاع
    }),
  },
});
