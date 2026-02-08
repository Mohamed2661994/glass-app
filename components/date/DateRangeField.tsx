import { useTheme } from "@/components/context/theme-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
};

export default function DateFieldFT({ label, value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const [show, setShow] = useState(false);

  const format = (d: Date | null) => {
    if (!d) return "اختر التاريخ";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`; // 👈 dd/mm/yyyy
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>

      <Pressable
        style={[
          styles.box,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: colors.text }}>{format(value)}</Text>
      </Pressable>

      {/* ================= ANDROID ================= */}
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      )}

      {/* ================= IOS ================= */}
      {show && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: colors.card, // 👈 يطابق الثيم تلقائي
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                textColor="#6e81eb"
                onChange={(e, date) => {
                  if (date) onChange(date);
                }}
                style={{ alignSelf: "center" }}
              />

              <Pressable
                onPress={() => setShow(false)}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>تم</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= WEB ================= */}
      {show && Platform.OS === "web" && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                اكتب التاريخ
              </Text>

              <input
                type="text"
                placeholder="dd/mm/yyyy"
                defaultValue={value ? format(value) : ""}
                autoFocus
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  let digits = e.target.value.replace(/\D/g, ""); // أرقام فقط
                  if (digits.length > 8) digits = digits.slice(0, 8);

                  let formatted = digits;

                  if (digits.length > 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                  } else if (digits.length > 2) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  }

                  e.target.value = formatted;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const parts = (e.target as HTMLInputElement).value.split(
                      "/",
                    );
                    if (parts.length === 3) {
                      const d = new Date(
                        Number(parts[2]),
                        Number(parts[1]) - 1,
                        Number(parts[0]),
                      );
                      if (!isNaN(d.getTime())) {
                        onChange(d);
                        setShow(false);
                      }
                    }
                  }
                }}
                style={{
                  width: "92%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 12,
                  fontSize: 14,
                  textAlign: "center",
                }}
              />

              <Pressable
                onPress={() => setShow(false)}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>تم</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: 6, fontWeight: "600" },

  box: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 16,
  },
  webOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  webBox: {
    width: 320,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },

  doneBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
