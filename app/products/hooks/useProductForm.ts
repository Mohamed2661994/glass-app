import api from "@/services/api";
import { useRef, useState } from "react";
import { TextInput } from "react-native";
import { Product } from "../types";

export function useProductForm(onSuccess: () => Promise<void>) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [retailPurchasePrice, setRetailPurchasePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [wholesalePackage, setWholesalePackage] = useState("");
  const [retailPackage, setRetailPackage] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [barcode, setBarcode] = useState("");
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef<TextInput>(null);

  const resetForm = () => {
    setEditingId(null);
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

  const fillForm = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setWholesalePackage(product.wholesale_package);
    setRetailPackage(product.retail_package);
    setManufacturer(product.manufacturer || "");
    setBarcode(product.barcode || "");
    setPurchasePrice(String(product.purchase_price));
    setRetailPurchasePrice(String(product.retail_purchase_price || ""));
    setWholesalePrice(String(product.wholesale_price));
    setRetailPrice(String(product.retail_price));
    setDiscount(String(product.discount_amount || ""));

    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  };

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

    const payload = {
      name,
      wholesale_package: wholesalePackage,
      retail_package: retailPackage,
      manufacturer,
      barcode: barcode.trim() ? barcode.trim() : null,
      purchase_price: Number(purchasePrice),
      retail_purchase_price: Number(retailPurchasePrice),
      wholesale_price: Number(wholesalePrice),
      retail_price: Number(retailPrice),
      discount_amount: Number(discount || 0),
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }

      await onSuccess();
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.error || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return {
    editingId,
    name,
    setName,
    purchasePrice,
    setPurchasePrice,
    retailPurchasePrice,
    setRetailPurchasePrice,
    wholesalePrice,
    setWholesalePrice,
    retailPrice,
    setRetailPrice,
    discount,
    setDiscount,
    wholesalePackage,
    setWholesalePackage,
    retailPackage,
    setRetailPackage,
    manufacturer,
    setManufacturer,
    barcode,
    setBarcode,
    saving,
    nameInputRef,
    handleSave,
    resetForm,
    fillForm,
  };
}
