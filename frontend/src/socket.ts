import { io } from "socket.io-client";
export const socket = io("http://193.146.34.10:3000", {
  transports: ["websocket"],
});
