// frontend/src/socket.ts
import { io } from "socket.io-client";

// Determinar la URL de WebSocket:
// 1. Si existe la variable VITE_SOCKET_URL, usarla.
// 2. Si no, construir a partir del esquema y host actuales.
const envUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
const fallbackUrl = `${
  window.location.protocol === "https:" ? "wss" : "ws"
}://${window.location.host}`;
const socketUrl = envUrl && envUrl.length > 0 ? envUrl : fallbackUrl;

// Debug: muestra la URL final que se usará
console.log("🔗 Conectando WS a:", socketUrl);

// Inicializar Socket.IO
export const socket = io(socketUrl, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  // autoConnect: false, // opcional si quieres controlar cuándo conectar
});

// Logs de depuración
socket.on("connect", () => console.log("✅ WS conectado:", socket.id));
socket.on("connect_error", (err) => console.error("❌ WS ERROR:", err));
