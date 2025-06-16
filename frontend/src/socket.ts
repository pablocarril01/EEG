import { io } from "socket.io-client";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const localSocketURL = "http://localhost:3000"; // :contentReference[oaicite:2]{index=2}
const productionSocketURL = import.meta.env.VITE_SOCKET_URL as string;

export const socket = io(isLocal ? localSocketURL : productionSocketURL, {
  path: "/socket.io",
  transports: ["websocket"],
});
