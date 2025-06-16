// frontend/src/socket.ts
import { io } from "socket.io-client";

// Leer la URL de WebSocket desde variables de entorno de Vite
const socketUrl = import.meta.env.VITE_SOCKET_URL as string;

// Inicializar el socket; forzamos ws y deshabilitamos la verificación de certificado para entornos sin proxy SSL
export const socket = io(socketUrl, {
  transports: ["websocket"], // Solo websocket, sin polling
  secure: false, // Desactiva wss en entornos no TLS
  rejectUnauthorized: false, // Acepta certificados auto-firmados si hubiera
});
