import { Dimensions } from "react-native";

export default function useResponsiveColumns() {
  const { width } = Dimensions.get("window");

  if (width < 600) return 2; // موبايل
  if (width < 1000) return 3; // تابلت
  return 4; // ويب
}
