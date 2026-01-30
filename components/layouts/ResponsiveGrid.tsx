import { StyleSheet, View } from "react-native";

export default function ResponsiveGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
