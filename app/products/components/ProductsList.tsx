import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Product } from "../types";
import ProductCard from "./ProductCard";

type Props = {
  filtered: Product[];
  loading: boolean;
  refreshing: boolean;
  search: string;
  setSearch: (v: string) => void;
  onRefresh: () => void;
  toggleProduct: (id: number, value: boolean) => void;
  onEdit: (product: Product) => void;
  onPrint: (product: Product) => void;
};

const ITEMS_PER_PAGE = 10;

export default function ProductsList({
  filtered,
  loading,
  refreshing,
  search,
  setSearch,
  onRefresh,
  toggleProduct,
  onEdit,
  onPrint,
}: Props) {
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);

  // 🔁 رجّع لأول صفحة عند البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 📐 Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filtered, currentPage]);

  return (
    <ThemedView
      style={[
        {
          backgroundColor: colors.card,
          flex: 1,
          minHeight: 0,
          padding: 16,
        },
        Platform.OS === "web" && { maxWidth: 820 },
      ]}
    >
      {/* 🔍 Search */}
      <TextInput
        placeholder="بحث عن صنف..."
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        style={{
          height: 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.input,
          borderColor: colors.border,
          color: colors.text,
          marginBottom: 10,
        }}
      />

      {/* 📜 List */}
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
        ) : paginatedProducts.length === 0 ? (
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {paginatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onToggle={toggleProduct}
                onEdit={onEdit}
                onPrint={onPrint}
              />
            ))}
          </View>
        )}
      </ScrollView>
      {totalPages > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: colors.border,
            flexWrap: "wrap",
          }}
        >
          {/* السابق */}
          <ThemedText
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: colors.input,
              color: colors.text,
            }}
          >
            السابق
          </ThemedText>

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            const active = page === currentPage;

            return (
              <ThemedText
                key={page}
                onPress={() => setCurrentPage(page)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: active ? colors.primary : colors.input,
                  color: active ? "#fff" : colors.text,
                  fontWeight: active ? "700" : "400",
                }}
              >
                {page}
              </ThemedText>
            );
          })}

          {/* التالي */}
          <ThemedText
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: colors.input,
              color: colors.text,
            }}
          >
            التالي
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}
