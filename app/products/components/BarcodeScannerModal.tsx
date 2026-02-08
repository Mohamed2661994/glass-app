import { ThemedText } from "@/components/themed-text";
import { Audio } from "expo-av";
import { CameraView } from "expo-camera";
import { useEffect, useState } from "react";
import { Modal, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

export default function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: Props) {
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!visible) setScanned(false);
  }, [visible]);

  const playBeep = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("../../../assets/sounds/beep-7.mp3"),
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      // @ts-ignore
      if (status?.didJustFinish) sound.unloadAsync();
    });
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "code128", "qr"],
          }}
          onBarcodeScanned={async ({ data }) => {
            if (scanned) return;
            setScanned(true);
            await playBeep();
            onScanned(data);
            onClose();
          }}
        />

        <View
          style={{
            position: "absolute",
            inset: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 260,
              height: 160,
              borderWidth: 2,
              borderColor: "#2f80ed",
              borderRadius: 12,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            bottom: 40,
            alignSelf: "center",
            backgroundColor: "#000",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#fff",
          }}
        >
          <ThemedText style={{ color: "#fff" }}>إغلاق</ThemedText>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
