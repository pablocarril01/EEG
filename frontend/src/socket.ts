import { io } from "socket.io-client";

const socket = io(process.env.URL_BACKEND || "http://localhost:3000", {
  transports: ["websocket"],
});

export { socket };
