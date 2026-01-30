import { io } from "socket.io-client";
import { API_URL } from "./api"; // 👈 نستخدم نفس الدومين

export const socket = io(API_URL, {
  transports: ["websocket"],
  autoConnect: false, // 👈 مهم عشان نتحكم في الاتصال بعد اللوجين
});
