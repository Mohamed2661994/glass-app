import { ScrollView, StyleSheet } from "react-native";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1, // 👈 دي أهم سطر
  },
});
