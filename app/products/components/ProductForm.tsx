import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Platform, TextInput, TouchableOpacity } from "react-native";

type Props = {
  form: any;
  onOpenScanner: () => void;
};

export default function ProductForm({ form, onOpenScanner }: Props) {
  const { colors } = useTheme();

  return (
    <ThemedView
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        gap: 10,
        width: Platform.OS === "web" ? 400 : "100%",
        alignSelf: "flex-start",
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
        editable={!form.editingId}
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
        ref={form.nameInputRef}
        placeholder="اسم الصنف"
        placeholderTextColor="#888"
        value={form.name}
        onChangeText={form.setName}
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
        placeholder="المصنع"
        value={form.manufacturer}
        onChangeText={form.setManufacturer}
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
        placeholder="عبوة الجملة"
        value={form.wholesalePackage}
        onChangeText={form.setWholesalePackage}
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
        placeholder="عبوة القطاعي"
        value={form.retailPackage}
        onChangeText={form.setRetailPackage}
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
        placeholder="سعر الشراء جملة"
        keyboardType="numeric"
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
        placeholder="سعر البيع جملة"
        keyboardType="numeric"
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
        placeholder="سعر الشراء قطاعي"
        keyboardType="numeric"
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
        placeholder="سعر البيع قطاعي"
        keyboardType="numeric"
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
        placeholder="خصم ثابت"
        keyboardType="numeric"
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
