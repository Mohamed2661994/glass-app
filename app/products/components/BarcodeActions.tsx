import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { TouchableOpacity, View } from "react-native";

type Props = {
  barcode: string;
  onPrint: () => void;
};

export default function BarcodeActions({ barcode, onPrint }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <ThemedText style={{ fontSize: 13, color: "#8aa4ff" }}>
        {barcode}
      </ThemedText>

      <View style={{ flexDirection: "row-reverse", gap: 10 }}>
        {/* طباعة */}
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.botmta,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={onPrint}
        >
          <Ionicons name="print-outline" size={16} color="#fff" />
        </TouchableOpacity>

        {/* نسخ */}
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.botmbar,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={async () => {
            await Clipboard.setStringAsync(barcode);
            alert("تم نسخ الباركود");
          }}
        >
          <Ionicons name="copy-outline" size={16} color="#2f80ed" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
