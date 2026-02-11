import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ManufacturerCombobox from "@/components/ui/ManufacturerCombobox";
import { useRef, useState } from "react";
import { Platform, TextInput, TouchableOpacity } from "react-native";
import RetailPackageInput from "./RetailPackageInput";
import WholesalePackageInput from "./WholesalePackageInput";
type Props = {
  form: any;
  onOpenScanner: () => void;
};

export default function ProductForm({ form, onOpenScanner }: Props) {
  const { colors } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<
    "manufacturer" | "wholesale" | "retail" | null
  >(null);
  const nameRef = useRef<TextInput>(null);
  const wholesaleCountRef = useRef<TextInput>(null);
  const retailCountRef = useRef<TextInput>(null);
  const wholesalePurchasePriceRef = useRef<TextInput>(null);
  const wholesalePriceRef = useRef<TextInput>(null);
  const retailPurchasePriceRef = useRef<TextInput>(null);
  const retailPriceRef = useRef<TextInput>(null);
  const discountRef = useRef<TextInput>(null);
  return (
    <ThemedView
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        gap: 10,
        width: Platform.OS === "web" ? 400 : "100%",
        alignSelf: "flex-start",
        overflow: "visible",
      }}
    >
      <ThemedText
        style={{
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 12,
          color: form.editingId ? "#ffc415" : colors.text,
        }}
      >
        {form.editingId ? "تعديل صنف" : "إضافة صنف جديد"}
      </ThemedText>

      {/* ===== Barcode ===== */}
      <TextInput
        placeholder="الباركود (اختياري)"
        placeholderTextColor="#888"
        value={form.barcode}
        //editable={!form.editingId}
        onChangeText={form.setBarcode}
        keyboardType="numeric"
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      {Platform.OS !== "web" && (
        <TouchableOpacity
          onPress={onOpenScanner}
          style={{ alignSelf: "flex-end" }}
        >
          <ThemedText style={{ color: "#2f80ed" }}>فتح الكاميرا</ThemedText>
        </TouchableOpacity>
      )}

      <TextInput
        ref={nameRef}
        placeholder="اسم الصنف"
        value={form.name}
        onChangeText={form.setName}
        returnKeyType="next"
        onSubmitEditing={() => setOpenDropdown("manufacturer")}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      {/* ===== المصنع ===== */}
      <ManufacturerCombobox
        value={form.manufacturer}
        onChange={form.setManufacturer}
        open={openDropdown === "manufacturer"}
        onOpen={() => setOpenDropdown("manufacturer")}
        onClose={() => setOpenDropdown(null)}
        onNext={() => {
          setOpenDropdown("wholesale");
          requestAnimationFrame(() => wholesaleCountRef.current?.focus());
        }}
      />

      {/* ===== جملة ===== */}
      <WholesalePackageInput
        value={form.wholesalePackage}
        onChange={form.setWholesalePackage}
        open={openDropdown === "wholesale"}
        onOpen={() => setOpenDropdown("wholesale")}
        onClose={() => setOpenDropdown(null)}
        countRef={wholesaleCountRef}
        onNext={() => {
          setOpenDropdown("retail");
          requestAnimationFrame(() => retailCountRef.current?.focus());
        }}
      />

      <RetailPackageInput
        value={form.retailPackage}
        onChange={form.setRetailPackage}
        open={openDropdown === "retail"}
        onOpen={() => setOpenDropdown("retail")}
        onClose={() => setOpenDropdown(null)}
        countRef={retailCountRef}
        onNext={() => wholesalePurchasePriceRef.current?.focus()}
      />

      <TextInput
        ref={wholesalePurchasePriceRef}
        placeholder="سعر الشراء جملة"
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => wholesalePriceRef.current?.focus()}
        blurOnSubmit={false}
        value={form.purchasePrice}
        onChangeText={form.setPurchasePrice}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      <TextInput
        ref={wholesalePriceRef}
        placeholder="سعر البيع جملة"
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => retailPurchasePriceRef.current?.focus()}
        blurOnSubmit={false}
        value={form.wholesalePrice}
        onChangeText={form.setWholesalePrice}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />
      <TextInput
        ref={retailPurchasePriceRef}
        placeholder="سعر الشراء قطاعي"
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => retailPriceRef.current?.focus()}
        blurOnSubmit={false}
        value={form.retailPurchasePrice}
        onChangeText={form.setRetailPurchasePrice}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      <TextInput
        ref={retailPriceRef}
        placeholder="سعر البيع قطاعي"
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => discountRef.current?.focus()}
        blurOnSubmit={false}
        value={form.retailPrice}
        onChangeText={form.setRetailPrice}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      <TextInput
        ref={discountRef}
        placeholder="خصم ثابت"
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={form.handleSave}
        value={form.discount}
        onChangeText={form.setDiscount}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      <TouchableOpacity
        onPress={form.handleSave}
        disabled={form.saving}
        style={{
          backgroundColor: "#2f80ed",
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <ThemedText style={{ fontWeight: "bold" }}>
          {form.saving
            ? "جاري الحفظ..."
            : form.editingId
              ? "تعديل الصنف"
              : "حفظ الصنف"}
        </ThemedText>
      </TouchableOpacity>

      {form.editingId && (
        <TouchableOpacity onPress={form.resetForm}>
          <ThemedText style={{ textAlign: "center", marginTop: 10 }}>
            إلغاء التعديل
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}
