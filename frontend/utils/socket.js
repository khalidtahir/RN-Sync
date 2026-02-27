// utils/socket.js
import { io } from "socket.io-client";

// For local development, use your computer's IP address (e.g., "http://192.168.0.10:3000")
// instead of localhost if testing on a physical device or emulator.
// If using an Android emulator, try http://10.0.2.2:<port>.
const URL = "http://10.216.219.27:3000"; // Your backend server URL

// Pass the transports option explicitly to use websockets
export const socket = io(URL, {
  transports: ["websocket"],
});
