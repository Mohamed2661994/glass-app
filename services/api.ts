import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const LOCAL_API = "http://192.168.1.63:3001";
const PROD_API = "https://glass-system-backend.onrender.com";

export const API_URL = __DEV__
  ? "http://192.168.1.63:3001"
  : "https://glass-system-backend.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const getToken = async () => {
  if (Platform.OS === "web") return localStorage.getItem("token");
  return await SecureStore.getItemAsync("token");
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
