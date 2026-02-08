import { useTheme } from "@/components/context/theme-context";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
};

export default function PageHeader({ title }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingTop: Platform.OS === "web" ? 20 : 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* العنوان */}
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            flex: 1,
          }}
        >
          {title}
        </ThemedText>

        {/* زر الرجوع */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Spacer علشان العنوان يفضل في النص */}
        <View style={{ width: 36 }} />
      </View>
    </View>
  );
}
