import { Platform, StyleSheet, View } from "react-native";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.container, Platform.OS === "web" && styles.webFix]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webFix: {
    height: "100vh" as any, // 👈 يمنع سكرول الصفحة
    overflow: "hidden" as any, // 👈 أي سكرول يبقى داخلي فقط
  },
});
