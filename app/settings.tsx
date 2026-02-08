import { useTheme } from "@/components/context/theme-context";
import BackButton from "@/components/ui/BackButton";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as LocalAuth from "expo-local-authentication";
import { Stack } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
  const { mode, setMode, isDark, colors } = useTheme();

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  const CONFIRM_WORD = "RESET";

  /* ================= BIOMETRIC ================= */
  const authenticateBiometric = async () => {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;

    const res = await LocalAuth.authenticateAsync({
      promptMessage: "تأكيد الهوية",
    });

    return res.success;
  };

  /* ================= FACTORY RESET ================= */
  const handleFactoryReset = async () => {
    if (confirmText !== CONFIRM_WORD) return;

    const ok = await authenticateBiometric();
    if (!ok) return Alert.alert("فشل التحقق", "لم يتم التحقق من الهوية");

    Alert.alert("تأكيد نهائي", "لا يمكن التراجع عن هذه العملية", [
      { text: "إلغاء", style: "cancel" },
      { text: "نعم، امسح", style: "destructive", onPress: doReset },
    ]);
  };

  const doReset = async () => {
    try {
      setLoading(true);
      await api.post("/system/factory-reset");
      setShowResetModal(false);
      setConfirmText("");
      Alert.alert("تم", "تمت إعادة ضبط المصنع");
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.error || "فشل التنفيذ");
    } finally {
      setLoading(false);
    }
  };

  /* ================= BACKUP ================= */
  const handleBackup = async () => {
    try {
      await api.post("/system/backup");
      setStatusModal({ visible: true, type: "backup", success: true });
    } catch {
      setStatusModal({ visible: true, type: "backup", success: false });
    }
  };

  const handleRestore = async () => {
    Alert.alert("استعادة", "سيتم استرجاع آخر نسخة احتياطية", [
      { text: "إلغاء" },
      {
        text: "استعادة",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/system/restore");
            setStatusModal({ visible: true, type: "restore", success: true });
          } catch {
            setStatusModal({ visible: true, type: "restore", success: false });
          }
        },
      },
    ]);
  };

  const openFactoryResetModal = async () => {
    try {
      const { data } = await api.get("/system/tables");
      setTables(data);
      setShowTablesModal(true);
    } catch {
      Alert.alert("خطأ", "فشل تحميل الجداول");
    }
  };
  const toggleTable = (name: string) => {
    setSelectedTables((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };
  const handleSelectiveReset = async () => {
    console.log("START RESET");
    console.log("Selected Tables:", selectedTables);

    if (selectedTables.length === 0) {
      Alert.alert("تنبيه", "اختر جدول واحد على الأقل");
      return;
    }

    try {
      setLoading(true);

      console.log("SENDING REQUEST...");
      const res = await api.post("/system/factory-reset", {
        tables: selectedTables,
      });
      console.log("CLEARED TABLES FROM SERVER:", res.data.cleared_tables);

      setConfirmResetModal(false);
      setShowTablesModal(false);
      setSelectedTables([]);

      setStatusModal({ visible: true, type: null, success: true });
    } catch (err: any) {
      console.log("RESET ERROR:", err?.response?.status, err?.response?.data);
      Alert.alert("خطأ", err?.response?.data?.error || "فشل تنفيذ المسح");
    } finally {
      setLoading(false);
    }
  };

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    type: "backup" | "restore" | null;
    success: boolean;
  }>({ visible: false, type: null, success: false });

  const StatusOverlay = () => {
    if (!statusModal.visible) return null;

    const content = (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Ionicons
            name={statusModal.success ? "checkmark-circle" : "close-circle"}
            size={48}
            color={statusModal.success ? "#22c55e" : "#ef4444"}
            style={{ alignSelf: "center", marginBottom: 10 }}
          />

          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {statusModal.success ? "تم بنجاح" : "فشل التنفيذ"}
          </Text>

          <Text style={{ color: colors.muted, textAlign: "center" }}>
            {statusModal.type === "backup"
              ? statusModal.success
                ? "تم إنشاء النسخة الاحتياطية بنجاح"
                : "حدث خطأ أثناء إنشاء النسخة الاحتياطية"
              : statusModal.success
                ? "تمت استعادة النسخة الاحتياطية بنجاح"
                : "فشل استعادة النسخة الاحتياطية"}
          </Text>

          <Pressable
            style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              setStatusModal({ visible: false, type: null, success: false })
            }
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>حسناً</Text>
          </Pressable>
        </View>
      </View>
    );

    // 👇 على الموبايل استخدم Modal
    if (Platform.OS !== "web") {
      return (
        <Modal transparent animationType="fade" visible>
          {content}
        </Modal>
      );
    }

    // 👇 على الويب استخدم Overlay عادي
    return content;
  };

  const changeTheme = async (value: "light" | "dark" | "system") => {
    try {
      setMode(value); // يغير محليًا فورًا

      await api.put("/users/theme", { theme: value }); // يحفظ في السيرفر
    } catch (err) {
      Alert.alert("خطأ", "فشل حفظ الثيم على السيرفر");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "الإعدادات",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View
            style={[
              styles.settingsBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {/* THEME */}
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                المظهر
              </Text>

              {THEME_OPTIONS.map((option) => {
                const isActive = mode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      mode !== option.value && changeTheme(option.value)
                    }
                    style={[
                      styles.option,
                      {
                        backgroundColor: isActive
                          ? colors.primary + "22"
                          : "transparent",
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={{ color: colors.text }}>{option.label}</Text>
                    </View>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}

              {/* BACKUP */}
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                النسخ الاحتياطي
              </Text>

              <Pressable style={styles.advancedBtn} onPress={handleBackup}>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.advancedText}>إنشاء نسخة احتياطية</Text>
              </Pressable>

              <Pressable style={styles.advancedBtn} onPress={handleRestore}>
                <Ionicons name="cloud-download" size={20} color="#fff" />
                <Text style={styles.advancedText}>
                  استعادة النسخة الاحتياطية
                </Text>
              </Pressable>

              {/* FACTORY RESET */}
              <Pressable
                style={styles.resetBtn}
                onPress={openFactoryResetModal}
              >
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.resetText}>إعادة ضبط المصنع</Text>
              </Pressable>

              {/* DEVICE INFO */}
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                معلومات النظام
              </Text>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                📱 {Device.modelName}
              </Text>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                💻 {Device.osName} {Device.osVersion}
              </Text>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                🚀 إصدار التطبيق: {Application.nativeApplicationVersion}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* RESET MODAL */}
        <Modal transparent animationType="fade" visible={showResetModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                ⚠️ إعادة ضبط المصنع
              </Text>

              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
                placeholder="RESET"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#7f1d1d" }]}
                onPress={handleFactoryReset}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? "جارٍ المسح..." : "امسح"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Modal transparent animationType="fade" visible={showTablesModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                اختر الجداول التي تريد مسحها
              </Text>

              <ScrollView style={{ maxHeight: 250 }}>
                {tables.map((table) => {
                  const selected = selectedTables.includes(table.key);

                  return (
                    <Pressable
                      key={table.key}
                      onPress={() => toggleTable(table.key)}
                      style={styles.tableRow}
                    >
                      <Ionicons
                        name={selected ? "checkbox" : "square-outline"}
                        size={22}
                        color={selected ? colors.primary : colors.muted}
                      />
                      <Text style={{ color: colors.text }}>{table.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#7f1d1d" }]}
                onPress={() => {
                  setShowTablesModal(false); // اقفل الأول
                  setTimeout(() => {
                    setConfirmResetModal(true); // افتح مودال التأكيد بعده
                  }, 200); // وقت بسيط عشان الأنيميشن
                }}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? "جارٍ المسح..." : "تنفيذ المسح"}
                </Text>
              </Pressable>

              {/* 🔹 زرار الإلغاء */}
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowTablesModal(false);
                  setSelectedTables([]);
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  إلغاء
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <StatusOverlay />
        {confirmResetModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Ionicons
                name="warning"
                size={46}
                color="#f59e0b"
                style={{ alignSelf: "center", marginBottom: 10 }}
              />

              <Text style={[styles.modalTitle, { color: colors.text }]}>
                تأكيد المسح
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  textAlign: "center",
                  marginBottom: 15,
                }}
              >
                سيتم حذف البيانات المحددة نهائيًا ولا يمكن التراجع
              </Text>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#7f1d1d" }]}
                onPress={handleSelectiveReset}
              >
                <Text style={{ color: "#fff" }}>
                  {loading ? "جارٍ المسح..." : "نعم، امسح البيانات"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setConfirmResetModal(false)}
              >
                <Text style={{ color: colors.text }}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { alignItems: "center", padding: 20, paddingBottom: 40 },

  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },

  sectionTitle: { fontSize: 13, marginVertical: 10, fontWeight: "600" },

  option: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  advancedBtn: {
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  advancedText: { color: "#fff", fontWeight: "700" },

  resetBtn: {
    backgroundColor: "#7f1d1d",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },

  resetText: { color: "#fff", fontWeight: "700" },

  infoText: { fontSize: 13, marginBottom: 4 },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999, // مهم جدًا للويب
  },

  settingsBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },

  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
});
