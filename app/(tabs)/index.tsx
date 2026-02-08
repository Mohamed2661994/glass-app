import { useAuth } from "@/components/context/AuthContext";
import { useNotifications } from "@/components/context/NotificationContext";
import { useTheme } from "@/components/context/theme-context";
import { socket } from "@/services/socket"; // 🔥 فوق مع الاستيرادات
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createContext, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CashCountForm from "@/components/forms/CashCountForm";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ================== TYPES ================== */

type IconName =
  | "cart"
  | "cube"
  | "add"
  | "document-text"
  | "repeat"
  | "cash"
  | "settings"
  | "stats-chart"
  | "people"; // 👈 ضيف دي

interface CardItem {
  title: string;
  desc: string;
  icon: IconName;
  color: string;
  iconColor: string;
  route?: string;
}

/* ================== DATA ================== */

const CARDS: CardItem[] = [
  {
    title: "فاتورة قطاعي",
    desc: "بيع مباشر من المعرض",
    icon: "cart",
    color: "#22c55e",
    iconColor: "#fff",
    route: "/invoices/retail",
  },
  {
    title: "فاتورة جملة",
    desc: "بيع مخزن أو تاجر",
    icon: "cube",
    color: "#3b82f6",
    iconColor: "#fff",
    route: "/invoices/wholesale",
  },
  {
    title: "إضافة صنف",
    desc: "تسجيل صنف جديد",
    icon: "add",
    color: "#facc15",
    iconColor: "#000",
    route: "/products/ProductsScreen",
  },
  {
    title: "عرض الفواتير",
    desc: "بحث ومراجعة",
    icon: "document-text",
    color: "#94a3b8",
    iconColor: "#000",
    route: "/invoices",
  },
  {
    title: "استبدال مصنع",
    desc: "تحويل الأصناف",
    icon: "repeat",
    color: "#ef4444",
    iconColor: "#fff",
    route: "/replace",
  },
  {
    title: "تحويل مخزن",
    desc: "من الجملة إلى القطاعي",
    icon: "repeat",
    color: "#8b5cf6", // بنفسجي لطيف
    iconColor: "#fff",
    route: "/stock-transfer",
  },

  {
    title: "الخزنة",
    desc: "وارد / منصرف",
    icon: "cash",
    color: "#10b981",
    iconColor: "#fff",
    route: "/cash", // مش هيتستخدم فعليًا
  },
  {
    title: "التقارير",
    desc: "تقارير المخزون والحركة",
    icon: "stats-chart",
    color: "#0ea5e9",
    iconColor: "#fff",
  },
  {
    title: "الإعدادات",
    desc: "المظهر والتفضيلات",
    icon: "settings",
    color: "#64748b",
    iconColor: "#fff",
    route: "/settings",
  },
  {
    title: "المستخدمين",
    desc: "إدارة حسابات الموظفين",
    icon: "people",
    color: "#6366f1",
    iconColor: "#fff",
    route: "/users", // 👈 المسار
  },
];
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  invoice_id?: number; // 👈 جديد
  type?: "invoice_retail" | "invoice_wholesale"; // 👈 جديد
}

/* ================== SKELETON ================== */

function SkeletonCard() {
  return (
    <View style={[styles.card, { backgroundColor: "#020617" }]}>
      <View style={styles.skelIcon} />
      <View style={styles.skelLineShort} />
      <View style={styles.skelLineLong} />
    </View>
  );
}

/* ================== MAIN ================== */

export default function HomeScreen() {
  //const { mode, toggleTheme } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const IS_WEB = Platform.OS === "web";
  const [notifOpen, setNotifOpen] = useState(false);
  const notifBtnRef = useRef<View>(null);
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });
  const { notifications, setNotifications } = useNotifications();
  const NotificationContext = createContext<{
    notifications: AppNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  } | null>(null);
  const [cashCountModal, setCashCountModal] = useState(false);

  const { isDark, colors } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  // const user = { id: "user_id", branch_id: "branch_id" }; // 👈 Replace with actual user data from context/hook
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const IS_MOBILE = SCREEN_WIDTH < 600;
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const numColumns = SCREEN_WIDTH < 600 ? 2 : SCREEN_WIDTH < 1000 ? 3 : 4;
  // ✅ فلترة الكروت حسب صلاحيات الفرع
  const filteredCards = CARDS.filter((card) => {
    if (!user) return false;

    // فرع المعرض (1)
    if (user.branch_id === 1) {
      return true;
    }

    // فرع المخزن (2)
    if (user.branch_id === 2) {
      return card.title !== "فاتورة قطاعي";
    }

    return true;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "مساء الخير";
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#020617", "#0f172a", "#111827"]
          : ["#020617", "#0f172a", "#1e40af"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, paddingBottom: -insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={[
          { paddingBottom: 40 },
          IS_WEB && {
            flexGrow: 1,
            justifyContent: "center", // ⬅️ توسيط رأسي
            alignItems: "center", // ⬅️ توسيط أفقي
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== TITLE ===== */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#c9d0e6",
              borderColor: isDark ? "#1e293b" : "#e5e7eb",
            },
          ]}
        >
          {/* النصوص */}
          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>
              HG System
            </Text>
            <Text
              style={[
                styles.subtitleText,
                { color: colors.text, textAlign: "left" },
              ]}
            >
              نظام إدارة الفواتير والمخزون
            </Text>

            <View style={styles.headerTopRow}>
              <Text style={[styles.subtitleText, { color: colors.text }]}>
                {user
                  ? `${getGreeting()}، ${user.username} `
                  : `${getGreeting()} `}
              </Text>

              {/* 👈 الأزرار جنب الترحيب فقط في الشاشات الكبيرة */}
              {!IS_MOBILE && (
                <View style={styles.headerActions}>
                  {user?.branch_id === 2 && (
                    <Pressable
                      ref={notifBtnRef}
                      onPress={() => {
                        notifBtnRef.current?.measureInWindow(
                          (x, y, width, height) => {
                            setNotifPos({
                              top: y + height + 8,
                              right:
                                Dimensions.get("window").width - (x + width),
                            });

                            setNotifOpen((prev) => !prev);
                          },
                        );
                      }}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        { opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons
                        name="notifications-outline"
                        size={22}
                        color={colors.text}
                      />
                      {notifications.some((n) => !n.read) && (
                        <View style={styles.badge} />
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      if (Platform.OS === "web") {
                        setCashCountModal(true);
                      } else {
                        router.push("/cash-count");
                      }
                    }}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={22}
                      color={colors.text}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => setLogoutModalVisible(true)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={22}
                      color={colors.text}
                    />
                  </Pressable>
                </View>
              )}
            </View>

            {/* 👇 على الموبايل الأزرار تنزل تحت الكلام */}
            {IS_MOBILE && (
              <View style={styles.headerActions}>
                {user?.branch_id === 2 && (
                  <Pressable
                    ref={notifBtnRef}
                    onPress={() => {
                      notifBtnRef.current?.measureInWindow(
                        (x, y, width, height) => {
                          setNotifPos({
                            top: y + height + 8,
                            right: Dimensions.get("window").width - (x + width),
                          });
                          setNotifOpen((prev) => !prev);
                        },
                      );
                    }}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={22}
                      color={colors.text}
                    />
                    {notifications.some((n) => !n.read) && (
                      <View style={styles.badge} />
                    )}
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setLogoutModalVisible(true)}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            )}
          </View>

          {/* اللوجو */}
          <Image
            source={
              isDark
                ? require("@/assets/images/logo-light.png")
                : require("@/assets/images/logo-dark.png")
            }
            style={styles.headerLogo}
            contentFit="contain"
          />
        </View>

        {/* ===== GRID ===== */}
        <View style={IS_WEB ? styles.gridWebWrapper : undefined}>
          <View style={IS_WEB ? styles.gridWeb : styles.grid}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : filteredCards.map((card, index) => (
                  <AnimatedCard
                    key={card.title}
                    card={card}
                    index={index}
                    numColumns={numColumns} // 👈 مهم
                    onPress={() => {
                      if (card.title === "الخزنة") {
                        setCashModalOpen(true);
                      } else if (card.title === "التقارير") {
                        setReportsModalOpen(true);
                      } else if (card.route) {
                        router.push(card.route as any);
                      }
                    }}
                  />
                ))}
          </View>
        </View>

        {cashModalOpen && (
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: IS_MOBILE ? 420 : 320,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                الخزنة
              </Text>

              <View style={styles.cashSection}>
                {/* الصف الأول */}
                <View style={styles.cashRow}>
                  <Pressable
                    style={[
                      styles.cashPrimaryBtn,
                      { backgroundColor: "#22c55e" },
                    ]}
                    onPress={() => {
                      setCashModalOpen(false);
                      router.push("/cash/cashin");
                    }}
                  >
                    <Ionicons name="add-circle" size={26} color="#fff" />
                    <Text style={styles.cashPrimaryText}>وارد</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.cashPrimaryBtn,
                      { backgroundColor: "#ef4444" },
                    ]}
                    onPress={() => {
                      setCashModalOpen(false);
                      router.push("/cash/cashout");
                    }}
                  >
                    <Ionicons name="remove-circle" size={26} color="#fff" />
                    <Text style={styles.cashPrimaryText}>منصرف</Text>
                  </Pressable>
                </View>

                {/* عنوان فرعي */}
                <Text style={[styles.cashSubTitle, { color: colors.muted }]}>
                  التقارير
                </Text>

                {/* أزرار التقارير */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setCashModalOpen(false);
                    router.push("/cash/outlist");
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.primary}
                  />

                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    عرض المنصرف
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setCashModalOpen(false);
                    router.push("/cash/inlist");
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.primary}
                  />

                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    عرض الوارد
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setCashModalOpen(false);
                    router.push("/cash/summary");
                  }}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    اليومية
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => setCashModalOpen(false)}
                style={[styles.modalCloseBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCloseText, { color: colors.muted }]}>
                  إغلاق
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        {reportsModalOpen && (
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: IS_MOBILE ? 420 : 320,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                التقارير
              </Text>

              <View style={styles.cashSection}>
                {/* 📦 جرد المخزون */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setReportsModalOpen(false);
                    router.push("/reports/inventory");
                  }}
                >
                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    تقرير جرد المخزن
                  </Text>
                </Pressable>

                {/* ⚠️ نقص المخزون */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setReportsModalOpen(false);
                    router.push("/reports/low-stock");
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color="#ef4444"
                  />
                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    تقرير نقص المخزون
                  </Text>
                </Pressable>

                {/* 🔄 حركة صنف */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setReportsModalOpen(false);
                    router.push("/reports/product-movement");
                  }}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={22}
                    color="#3b82f6"
                  />
                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    تقرير حركة صنف
                  </Text>
                </Pressable>

                {/* 💰 قيمة المخزون */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setReportsModalOpen(false);
                    router.push("/reports/inventory-value");
                  }}
                >
                  <Ionicons name="cash-outline" size={22} color="#10b981" />
                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    قيمة المخزون
                  </Text>
                </Pressable>

                {/* 💰 مديونية العملاء */}
                <Pressable
                  style={[
                    styles.cashSecondaryBtn,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setReportsModalOpen(false);
                    router.push("/reports/CustomerBalancesReportScreen");
                  }}
                >
                  <Ionicons name="wallet-outline" size={22} color="#ef4444" />

                  <Text
                    style={[styles.cashSecondaryText, { color: colors.text }]}
                  >
                    مديونية العملاء
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => setReportsModalOpen(false)}
                style={[styles.modalCloseBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCloseText, { color: colors.muted }]}>
                  إغلاق
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
      {cashCountModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: "#ffffff" }]}>
            <CashCountForm />
            <Pressable
              onPress={() => setCashCountModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ===== Logout Modal خارج الاسكرول ===== */}
      {logoutModalVisible && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.logoutModalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.logoutTitle, { color: colors.text }]}>
              تسجيل الخروج
            </Text>

            <Text style={[styles.logoutMessage, { color: colors.muted }]}>
              هل تريد تسجيل الخروج من الحساب؟
            </Text>

            <View style={styles.logoutActions}>
              <Pressable
                style={[styles.logoutCancelBtn, { borderColor: colors.border }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.logoutCancelText, { color: colors.text }]}>
                  إلغاء
                </Text>
              </Pressable>

              <Pressable
                style={styles.logoutConfirmBtn}
                onPress={async () => {
                  setLogoutModalVisible(false);

                  socket.disconnect(); // ❗ اقفل السوكت قبل تسجيل الخروج
                  await logout();

                  router.replace("/login");
                }}
              >
                <Text style={styles.logoutConfirmText}>تسجيل الخروج</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {notifOpen && user?.branch_id === 2 && (
        <>
          {/* طبقة شفافة تقفل القائمة */}
          <Pressable
            style={styles.overlay}
            onPress={() => setNotifOpen(false)}
          />

          <View style={[styles.notifDropdown, { top: notifPos.top }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.notifTitle}>الإشعارات</Text>

              {notifications.length === 0 ? (
                <Text style={styles.noNotif}>لا توجد إشعارات</Text>
              ) : (
                notifications.map((item: AppNotification) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.notifItem,
                      { backgroundColor: item.read ? "#0f172a" : "#1e293b" },
                    ]}
                    onPress={() => {
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === item.id ? { ...n, read: true } : n,
                        ),
                      );

                      setNotifOpen(false);

                      if (!item.invoice_id) return;

                      if (item.type === "invoice_wholesale") {
                        router.push(`/invoices/wholesale/${item.invoice_id}`);
                      } else if (item.type === "invoice_retail") {
                        router.push(`/invoices/retail/${item.invoice_id}`);
                      }
                    }}
                  >
                    <Text style={styles.notifItemTitle}>{item.title}</Text>
                    <Text style={styles.notifItemMsg}>{item.message}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

/* ================== CARD ================== */

function AnimatedCard({
  card,
  index,
  numColumns, // 👈 استقبله هنا
  onPress,
}: {
  card: CardItem;
  index: number;
  numColumns: number; // 👈 ضيفه في النوع
  onPress: () => void;
}) {
  const { isDark, colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;

  const bgInterpolate = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6], // ارتفاع بسيط
  });

  const IS_WEB = Platform.OS === "web"; // 👈 السطر المهم
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() =>
        Animated.timing(hover, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start()
      }
      onHoverOut={() =>
        Animated.timing(hover, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start()
      }
      style={{
        width: `${100 / numColumns - 3}%`, // 👈 Responsive حقيقي
        marginBottom: 16,
      }}
    >
      <Animated.View
        style={[
          styles.card,
          isDark ? styles.cardDark : styles.cardLight,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: card.color }]}>
          <Ionicons name={card.icon} size={22} color={card.iconColor} />
        </View>
        <Text
          style={[
            styles.cardTitle,
            { color: isDark ? "#e7e2e2ff" : "#020617" },
          ]}
        >
          {card.title}
        </Text>

        <Text
          style={[styles.cardDesc, { color: isDark ? "#e7e2e2ff" : "#020617" }]}
        >
          {card.desc}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ================== STYLES ================== */
//const CARD_WIDTH = 180; // ← المقاس اللي انت عايزه للكارت

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 28,
    flexDirection: "column", // 👈 مهم
    alignItems: "flex-start", // أو "flex-end" لو RTL
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: { color: "#180801", marginTop: 4 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  gridWebWrapper: {
    width: "100%",
    alignItems: "center", // 👈 يوسّط المحتوى
  },

  gridWeb: {
    width: "100%",
    maxWidth: 900, // 👈 هنا الثبات
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoutBtn: {
    padding: 8,
    borderRadius: 20,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    elevation: 4, // أندرويد
    shadowColor: "#110101", // iOS
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  headerCard: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 18,
    marginTop: 50,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    marginBottom: 24,
    borderWidth: 1,
    flexDirection: "row", // 👈 يخليهم جنب بعض
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoutModalBox: {
    width: 320,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },

  logoutTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  logoutMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 50,
  },

  logoutActions: {
    flexDirection: "row",

    justifyContent: "space-between",
    gap: 10,
  },

  logoutCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },

  logoutCancelText: {
    fontWeight: "600",
  },

  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#c70b0b",
    alignItems: "center",
  },

  logoutConfirmText: {
    color: "#fff",
    fontWeight: "700",
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  headerLogo: {
    width: 70,
    height: 70,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    //position: "absolute",
    //top: 18,
    //right: 18,
  },

  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  subtitleText: {
    marginTop: 6,
    fontSize: 14,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: {
    //color: "#e90707",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
  modalCloseBtn: {
    marginTop: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  modalCloseText: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  cardDesc: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "right",
  },
  cashSection: {
    gap: 14,
    marginTop: 10,
  },

  cashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  notifBtn: {
    padding: 8,
    marginRight: 6,
  },

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },

  notifTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "right",
  },

  noNotif: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
  },

  notifItem: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },

  notifItemTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "right",
  },

  notifItemMsg: {
    color: "#cbd5e1",
    fontSize: 13,
    textAlign: "right",
  },

  cashPrimaryBtn: {
    flex: 1,
    height: 70,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  cashPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cashSubTitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "right",
  },

  cashSecondaryBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  cashSecondaryText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    backgroundColor: "transparent",
  },

  notifDropdown: {
    position: "absolute",
    top: 90, // هيتعدل ديناميك كمان تحت
    right: 50,
    left: 100, // 👈 يخليها بعرض الشاشة مع مسافة جانبية
    maxHeight: Dimensions.get("window").height * 0.55,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    zIndex: 9999,
    elevation: 20,
  },

  skelIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1f2937",
    marginBottom: 12,
  },
  skelLineShort: {
    height: 14,
    width: "70%",
    backgroundColor: "#1f2937",
    borderRadius: 6,
    marginBottom: 8,
  },
  cardDark: {
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    borderColor: "#1e293b",
  },

  cardLight: {
    backgroundColor: "#c9d0e6",
    borderColor: "rgb(14, 1, 1)",
  },

  skelLineLong: {
    height: 12,
    width: "90%",
    backgroundColor: "#1f2937",
    borderRadius: 6,
  },

  modalBox: {
    maxWidth: "90%",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },

  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  modalBtnText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },

  modalCancel: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },

  reactLogo: {
    height: 180,
    width: 280,
    position: "absolute",
    left: 0,
    bottom: 0,
    opacity: 0.25,
  },
  cashGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  cashCard: {
    //flexBasis: "40%", // 👈 كرتين في الصف دايمًا
    height: 70,
    width: 130,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  cashCardText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
