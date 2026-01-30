import { useTheme } from "@/components/context/theme-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ThemeOption = {
  label: string;
  value: "light" | "dark" | "system";
  icon: keyof typeof Ionicons.glyphMap;
};

const THEME_OPTIONS: ThemeOption[] = [
  { label: "الوضع الفاتح", value: "light", icon: "sunny" },
  { label: "الوضع الداكن", value: "dark", icon: "moon" },
  { label: "حسب الجهاز", value: "system", icon: "settings" },
];

export default function SettingsScreen() {
  const { mode, setMode, isDark } = useTheme();

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const CONFIRM_WORD = "RESET";

  /* ================= FACTORY RESET ================= */

  const handleFactoryReset = async () => {
    if (confirmText !== CONFIRM_WORD) return;

    try {
      setLoading(true);
      await api.post("/system/factory-reset");

      setShowResetModal(false);
      setConfirmText("");

      Alert.alert("✅ تم", "تمت إعادة ضبط المصنع بنجاح");
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل إعادة الضبط");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#020617" : "#f8fafc" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#020617" }]}>
        الإعدادات
      </Text>

      {/* ===== THEME ===== */}
      <Text
        style={[styles.sectionTitle, { color: isDark ? "#94a3b8" : "#475569" }]}
      >
        المظهر
      </Text>

      {THEME_OPTIONS.map((option) => {
        const isActive = mode === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: isActive
                  ? isDark
                    ? "#1e293b"
                    : "#e2e8f0"
                  : "transparent",
                borderColor: isActive
                  ? "#3b82f6"
                  : isDark
                    ? "#1e293b"
                    : "#cbd5f5",
              },
            ]}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name={option.icon}
                size={20}
                color={isDark ? "#e5e7eb" : "#020617"}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: isDark ? "#fff" : "#020617" },
                ]}
              >
                {option.label}
              </Text>
            </View>

            {isActive && (
              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
            )}
          </Pressable>
        );
      })}

      {/* ===== SYSTEM ===== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? "#94a3b8" : "#475569", marginTop: 30 },
        ]}
      >
        النظام
      </Text>

      <Pressable
        onPress={() => setShowResetModal(true)}
        style={styles.resetBtn}
      >
        <Ionicons name="warning" size={20} color="#fff" />
        <Text style={styles.resetText}>إعادة ضبط المصنع</Text>
      </Pressable>

      {/* ===== RESET MODAL ===== */}
      <Modal transparent animationType="fade" visible={showResetModal}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDark ? "#020617" : "#fff" },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}
            >
              ⚠️ إعادة ضبط المصنع
            </Text>

            <Text
              style={{
                color: isDark ? "#94a3b8" : "#475569",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              سيتم حذف:
              {"\n"}• الفواتير
              {"\n"}• التحويلات
              {"\n"}• المخزون
              {"\n"}• حركات المخزن
              {"\n\n"}وسيتم الاحتفاظ بالأصناف فقط
            </Text>

            <Text
              style={{
                color: isDark ? "#e5e7eb" : "#020617",
                marginBottom: 6,
                fontWeight: "600",
              }}
            >
              اكتب RESET للتأكيد
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              placeholder="RESET"
              placeholderTextColor="#94a3b8"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#020617" : "#f1f5f9",
                  color: isDark ? "#fff" : "#000",
                  borderColor:
                    confirmText === CONFIRM_WORD ? "#16a34a" : "#cbd5f5",
                },
              ]}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable
                onPress={() => {
                  setShowResetModal(false);
                  setConfirmText("");
                }}
                style={[styles.modalBtn, { backgroundColor: "#475569" }]}
              >
                <Text style={{ color: "#fff" }}>إلغاء</Text>
              </Pressable>

              <Pressable
                disabled={confirmText !== CONFIRM_WORD || loading}
                onPress={handleFactoryReset}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      confirmText === CONFIRM_WORD ? "#7f1d1d" : "#94a3b8",
                  },
                ]}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? "جارٍ المسح..." : "امسح"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 24 },
  sectionTitle: { fontSize: 14, marginBottom: 12 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { fontSize: 16, fontWeight: "600" },

  resetBtn: {
    backgroundColor: "#7f1d1d",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resetText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 2,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
