import api from "@/services/api"; // 👈 يستخدم إعدادات السيرفر الجاهزة عندك
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
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
  const [branchId, setBranchId] = useState("");

  const loadUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      console.log("LOAD USERS ERROR:", err);
      Alert.alert("خطأ", "فشل تحميل المستخدمين");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!username || !password || !branchId) {
      Alert.alert("تنبيه", "اكمل البيانات");
      return;
    }

    try {
      await api.post("/users", {
        username,
        password,
        branch_id: Number(branchId),
      });

      Alert.alert("تم", "تم إنشاء المستخدم بنجاح ✅");
      setUsername("");
      setPassword("");
      setBranchId("");
      loadUsers();
    } catch (err: any) {
      console.log("CREATE USER ERROR:", err.response?.data || err.message);
      Alert.alert("خطأ", "فشل إنشاء المستخدم");
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>إدارة المستخدمين</Text>

      <Text style={styles.sectionTitle}>المستخدمين الحاليين</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        scrollEnabled={false}
      />

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>إضافة مستخدم جديد</Text>

        <TextInput
          placeholder="اسم المستخدم"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />

        <TextInput
          placeholder="كلمة المرور"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TextInput
          placeholder="رقم الفرع (1 المعرض - 2 المخزن)"
          keyboardType="numeric"
          value={branchId}
          onChangeText={setBranchId}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={createUser}>
          <Text style={styles.buttonText}>إنشاء مستخدم</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default UsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "right",
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  branch: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
    textAlign: "right",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    textAlign: "right",
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
