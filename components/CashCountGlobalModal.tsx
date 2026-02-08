import { Modal, Pressable, StyleSheet, View } from "react-native";

import { Platform } from "react-native";
import { useCashCount } from "./context/CashCountContext";
import CashCountForm from "./forms/CashCountForm";

export default function CashCountGlobalModal() {
  const { open, setOpen } = useCashCount();

  if (Platform.OS !== "web") return null;

  return (
    <Modal visible={open} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
        <View style={styles.modalBox}>
          <CashCountForm />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 420,
    maxHeight: "90%",
  },
});
