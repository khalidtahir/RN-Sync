/**
 * Example WebSocket integration with RN-Sync Backend Database
 * 
 * This file shows how to connect the WebSocket server (built by other backend lead)
 * to the database layer for storing real-time vitals data.
 * 
 * Integration flow:
 * 1. ICU sensors send vitals to WebSocket server
 * 2. WebSocket handler receives and validates data
 * 3. Data inserted into readings table via database utilities
 * 4. Readings broadcast to connected mobile clients
 * 5. Clients display real-time vitals from WebSocket
 */

import { Server } from 'socket.io';
import { 
  insertReading, 
  insertReadings, 
  getLatestReadings 
} from '../utils/dbUtils.js';

/**
 * Initialize WebSocket handlers for vital updates
 * 
 * @param {http.Server} httpServer - Express HTTP server
 * @returns {socket.io.Server} Configured Socket.IO server
 */
export const initializeWebSocketHandlers = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    /**
     * Handle vital update from ICU sensors
     * 
     * Data format:
     * {
     *   patientId: "uuid-1",
     *   heartRate: 82,
     *   spo2: 97,
     *   temperature: 37.2,
     *   bloodPressureSystolic: 120,
     *   bloodPressureDiastolic: 80,
     *   timestamp: "2025-01-20T10:05:00Z"
     * }
     */
    socket.on('vital-update', async (data) => {
      try {
        const { patientId, heartRate, spo2, temperature, bloodPressureSystolic, bloodPressureDiastolic } = data;

        // Validate required fields
        if (!patientId) {
          socket.emit('error', { message: 'patientId is required' });
          return;
        }

        // Insert readings into database
        const readings = [];
        
        if (heartRate !== undefined) {
          await insertReading(patientId, 'heart_rate', heartRate, 'bpm');
          readings.push({ metric: 'heart_rate', value: heartRate, unit: 'bpm' });
        }
        
        if (spo2 !== undefined) {
          await insertReading(patientId, 'spo2', spo2, '%');
          readings.push({ metric: 'spo2', value: spo2, unit: '%' });
        }
        
        if (temperature !== undefined) {
          await insertReading(patientId, 'temperature', temperature, '°C');
          readings.push({ metric: 'temperature', value: temperature, unit: '°C' });
        }
        
        if (bloodPressureSystolic !== undefined) {
          await insertReading(patientId, 'blood_pressure_systolic', bloodPressureSystolic, 'mmHg');
        }
        
        if (bloodPressureDiastolic !== undefined) {
          await insertReading(patientId, 'blood_pressure_diastolic', bloodPressureDiastolic, 'mmHg');
        }

        console.log(`✓ Vitals stored for patient ${patientId}: ${readings.map(r => r.metric).join(', ')}`);

        // Broadcast to all clients in this patient's room
        io.to(`patient-${patientId}`).emit('vital-update', {
          patientId,
          readings,
          timestamp: new Date().toISOString()
        });

        // Acknowledge receipt
        socket.emit('vital-update-ack', { success: true, patientId });

      } catch (error) {
        console.error('Error handling vital update:', error);
        socket.emit('error', { message: 'Failed to store vital data' });
      }
    });

    /**
     * Handle client joining a patient's vital stream
     */
    socket.on('join-patient', (patientId) => {
      socket.join(`patient-${patientId}`);
      console.log(`✓ Client joined patient ${patientId} stream`);
      
      // Send latest vitals on join
      getLatestReadings(patientId).then(readings => {
        socket.emit('initial-vitals', { patientId, readings });
      }).catch(err => {
        console.error('Error fetching initial vitals:', err);
      });
    });

    /**
     * Handle client leaving a patient's vital stream
     */
    socket.on('leave-patient', (patientId) => {
      socket.leave(`patient-${patientId}`);
      console.log(`✓ Client left patient ${patientId} stream`);
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`✗ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default initializeWebSocketHandlers;

/**
 * USAGE IN server.js:
 * 
 * import initializeWebSocketHandlers from './websocket/vitalUpdates.js';
 * 
 * const server = createServer(app);
 * const io = initializeWebSocketHandlers(server);
 * 
 * server.listen(PORT, () => {
 *   console.log(`Server running on port ${PORT}`);
 * });
 * 
 * USAGE FROM MOBILE CLIENT (React Native):
 * 
 * import io from 'socket.io-client';
 * 
 * const socket = io('http://backend-url:3000');
 * 
 * // Join patient stream
 * socket.emit('join-patient', patientId);
 * 
 * // Listen for vitals
 * socket.on('vital-update', (data) => {
 *   updateVitalsDisplay(data);
 * });
 * 
 * // Disconnect
 * socket.disconnect();
 * 
 * USAGE FROM ICU SENSORS (Node.js):
 * 
 * import io from 'socket.io-client';
 * 
 * const socket = io('http://backend-url:3000');
 * 
 * // Send vitals every 5 seconds
 * setInterval(() => {
 *   socket.emit('vital-update', {
 *     patientId: 'patient-uuid',
 *     heartRate: getHeartRate(),
 *     spo2: getSpO2(),
 *     temperature: getTemperature()
 *   });
 * }, 5000);
 */
