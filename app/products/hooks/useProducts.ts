import api from "@/services/api";
import { useEffect, useState } from "react";
import { Product } from "../types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

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

  const toggleProduct = async (id: number, value: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: value } : p)),
    );

    try {
      await api.put(`/admin/products/${id}/toggle`, {
        is_active: value,
      });
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !value } : p)),
      );
    }
  };

  return {
    products,
    filtered,
    loading,
    refreshing,
    search,
    setSearch,
    loadProducts,
    onRefresh,
    toggleProduct,
  };
}
