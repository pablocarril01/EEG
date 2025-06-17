import { io } from "socket.io-client";

// Detectar si estamos en local (docker/vite dev)
const hostname = window.location.hostname;

// URL que usarás en prod (defínela en .env como VITE_SOCKET_URL)
const prodUrl = import.meta.env.VITE_SOCKET_URL as string;

// Si estamos en localhost, usamos ws://localhost:3000
const socketUrl =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "ws://localhost:3000"
    : prodUrl;

// Debug: imprime la URL para ver qué está usando
console.log("🔗 Conectando WS a:", socketUrl);

export const socket = io(socketUrl, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

// Logs de depuración
socket.on("connect", () => console.log("✅ WS conectado como", socket.id));
socket.on("connect_error", (err) => console.error("❌ WS ERROR:", err));
