import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: number;
  username: string;
  branch_id: number;
}

const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState<number | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      console.log("LOAD USERS ERROR:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!username || !password || !branchId) {
      alert("اكمل البيانات");
      return;
    }

    try {
      await api.post("/users", {
        username,
        password,
        branch_id: branchId,
      });

      setUsername("");
      setPassword("");
      setBranchId(null);
      setSuccessModal(true);
      loadUsers();
    } catch (err: any) {
      console.log("CREATE USER ERROR:", err.response?.data || err.message);
      alert("فشل إنشاء المستخدم");
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Text style={styles.name}>{item.username}</Text>
      <Text style={styles.branch}>
        الفرع: {item.branch_id === 1 ? "المعرض" : "المخزن الرئيسي"}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "إدارة المستخدمين",
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={26} color="#007aff" />
            </Pressable>
          ),
          headerTitleAlign: "center",
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.sectionTitle}>المستخدمين الحاليين</Text>

        <View style={styles.centerWrap}>
          <View style={styles.listWrapper}>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUser}
              scrollEnabled={false}
            />
          </View>
        </View>

        <View style={styles.centerWrap}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>إضافة مستخدم جديد</Text>

            <Text style={styles.label}>اسم المستخدم</Text>
            <TextInput
              placeholder="مثال: ahmed"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
            />

            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput
              placeholder="أدخل كلمة مرور"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <Text style={styles.label}>الفرع</Text>

            <View style={{ marginBottom: 12 }}>
              <Pressable
                onPress={() => setShowBranchDropdown((prev) => !prev)}
                style={styles.dropdownButton}
              >
                <Text style={{ color: branchId ? "#000" : "#9ca3af" }}>
                  {branchId === 1
                    ? "المعرض (1)"
                    : branchId === 2
                      ? "المخزن الرئيسي (2)"
                      : "اختر الفرع..."}
                </Text>

                <Ionicons
                  name={showBranchDropdown ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9ca3af"
                />
              </Pressable>

              {showBranchDropdown && (
                <View style={styles.dropdownMenu}>
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBranchId(1);
                      setShowBranchDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>المعرض (1)</Text>
                  </Pressable>

                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBranchId(2);
                      setShowBranchDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>المخزن الرئيسي (2)</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={createUser}>
              <Text style={styles.buttonText}>إنشاء مستخدم</Text>
            </TouchableOpacity>
          </View>
        </View>

        {successModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>تم بنجاح 🎉</Text>
              <Text style={styles.modalMessage}>
                تم إنشاء مستخدم جديد بنجاح
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSuccessModal(false)}
              >
                <Text style={styles.modalButtonText}>حسناً</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default UsersScreen;

// ⬇️⬇️ الاستايلات زي ما هي بدون حذف
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "right",
  },
  centerWrap: { alignItems: "center", width: "100%" },
  listWrapper: { width: "100%", maxWidth: 500 },

  userCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "bold", textAlign: "right" },
  branch: { fontSize: 14, color: "#555", marginTop: 4, textAlign: "right" },

  formCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 3,
    width: "100%",
    maxWidth: 500,
  },

  label: { fontSize: 13, marginBottom: 4, color: "#444", textAlign: "right" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    textAlign: "right",
    backgroundColor: "#fafafa",
  },

  dropdownButton: {
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },

  dropdownItem: { padding: 12 },
  dropdownText: { fontSize: 14 },

  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
