/**
 * Example showing how to test the complete backend system
 * with database, API endpoints, and WebSocket integration
 */

import http from 'http';
import app from '../app.js';
import { initializeWebSocketHandlers } from '../websocket/vitalUpdates.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3000;

// Create HTTP server for both REST API and WebSocket
const server = http.createServer(app);

// Initialize WebSocket handlers
const io = initializeWebSocketHandlers(server);

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`✓ RN-Sync Backend Server Started`);
  console.log(`  REST API: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  WebSocket: ws://localhost:${WEBSOCKET_PORT}`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
