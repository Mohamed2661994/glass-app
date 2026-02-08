import WebLayout from "@/components/layouts/WebLayout";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import BarcodeScannerModal from "./components/BarcodeScannerModal";
import PrintBarcodeModal from "./components/PrintBarcodeModal";
import ProductForm from "./components/ProductForm";
import ProductsList from "./components/ProductsList";

import { useProductForm } from "./hooks/useProductForm";
import { useProducts } from "./hooks/useProducts";
import { Product } from "./types";

export default function ProductsScreen() {
  const router = useRouter();

  const products = useProducts();
  const form = useProductForm(products.loadProducts);

  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const Content = (
    <View
      style={{
        flex: 1,
        flexDirection: Platform.OS === "web" ? "row" : "column",
        gap: 24,
        padding: 16,
      }}
    >
      {/* ===== Form ===== */}
      <ProductForm
        form={form}
        onOpenScanner={async () => {
          if (!permission?.granted) {
            await requestPermission();
          }
          setScannerOpen(true);
        }}
      />

      {/* ===== List ===== */}
      <ProductsList
        {...products}
        onEdit={form.fillForm}
        onPrint={setPrintProduct}
      />

      {/* ===== Print Modal ===== */}
      {printProduct && (
        <PrintBarcodeModal
          product={printProduct}
          onClose={() => setPrintProduct(null)}
        />
      )}

      {/* ===== Barcode Scanner ===== */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(code) => form.setBarcode(code)}
      />
    </View>
  );

  return (
    <>
      {/* ===== Header Settings (زي باقي المشروع) ===== */}
      <Stack.Screen
        options={{
          title: "إدارة الأصناف",
          headerBackVisible: false,
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

      {/* ===== Page Content ===== */}
      {Platform.OS === "web" ? (
        <WebLayout>
          <View
            style={{
              flex: 1,
              alignItems: "center", // 👈 توسيط أفقي
            }}
          >
            <View
              style={{
                flex: 1,
                width: "100%",
                maxWidth: 1400, // 👈 عرض الصفحة كله
              }}
            >
              {Content}
            </View>
          </View>
        </WebLayout>
      ) : (
        Content
      )}
    </>
  );
}
