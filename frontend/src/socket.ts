import { io } from "socket.io-client";

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
//const host = window.location.hostname;
const port = 3000; // o el puerto real del backend

export const socket = io(`${protocol}://localhost:${port}`, {
  transports: ["websocket"],
  path: "/socket.io",
});
