import { useTheme } from "@/components/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
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

export default function DateField({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const format = (d: Date | null) =>
    d ? d.toLocaleDateString("en-GB") : "اختر التاريخ";

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>

      <Pressable
        style={[
          styles.box,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: colors.text, fontWeight: "600" }}>
          {format(value)}
        </Text>

        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>

      {/* ===== ANDROID ===== */}
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (event.type === "set" && selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}

      {/* ===== IOS ===== */}
      {show && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                textColor="#6e81eb"
                onChange={(event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
              />

              <Pressable
                onPress={() => setShow(false)}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>تم</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ===== WEB ===== */}
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
                اختر التاريخ
              </Text>

              <input
                type="date"
                value={(value || new Date()).toISOString().split("T")[0]}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) onChange(d);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShow(false); // 👈 يقفل المودال عند الضغط Enter
                  }
                }}
                autoFocus
                style={{
                  width: "92%",
                  padding: 10,
                  fontSize: 15,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 12,
                }}
              />

              <Pressable
                onPress={() => setShow(false)}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>تم</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },

  label: { fontSize: 12, marginBottom: 6, fontWeight: "600" },

  box: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  doneBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
