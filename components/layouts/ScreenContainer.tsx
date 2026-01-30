import { StyleSheet, View } from "react-native";

export default function ScreenContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 1100, // 👈 أقصى عرض لكل الشاشات
    alignSelf: "center",
    paddingHorizontal: 16,
  },
});
