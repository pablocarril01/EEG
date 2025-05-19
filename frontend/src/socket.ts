import { io } from "socket.io-client";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Local con Docker (conexión directa a backend en puerto 3000)
const localSocketURL = "http://localhost:3000";

// Producción: usar misma IP o dominio, pero WSS y puerto 443 (por Nginx)
const productionSocketURL = undefined; // conecta automáticamente con mismo origen

const socket = io(isLocal ? localSocketURL : productionSocketURL, {
  path: "/socket.io",
  transports: ["websocket"],
});

export { socket };
