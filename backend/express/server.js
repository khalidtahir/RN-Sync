import app from "./app.js";
import dotenv from "dotenv";

import initializeWebSocketHandlers from "./websocket/vitalUpdates.js";
import { createServer } from "http";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = createServer(app);
const io = initializeWebSocketHandlers(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n========================================`);
  console.log(`✓ RN-Sync Backend Server Started`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});
