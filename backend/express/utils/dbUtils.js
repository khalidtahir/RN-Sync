/**
 * Database utilities for integrating WebSocket data pipeline
 * Use these functions to insert readings from WebSocket into the database
 */

import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Insert a single reading into the database
 * Called from WebSocket handlers when new vital data arrives
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} metric - Metric name (e.g., 'heart_rate', 'spo2')
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement (e.g., 'bpm', '%')
 * @returns {Promise<Object>} Inserted reading row
 * 
 * @example
 * insertReading('patient-uuid', 'heart_rate', 82, 'bpm')
 */
export const insertReading = async (patientId, metric, value, unit) => {
  try {
    const readingId = uuidv4();
    const result = await pool.query(
      `INSERT INTO readings (id, patient_id, metric, value, unit, timestamp) 
       VALUES ($1, $2, $3, $4, $5, now()) 
       RETURNING *`,
      [readingId, patientId, metric, value, unit]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting reading:', error);
    throw error;
  }
};

/**
 * Insert multiple readings at once (batch insert for efficiency)
 * 
 * @param {string} patientId - Patient UUID
 * @param {Array<Object>} readings - Array of { metric, value, unit }
 * @returns {Promise<Array>} Array of inserted reading rows
 * 
 * @example
 * insertReadings('patient-uuid', [
 *   { metric: 'heart_rate', value: 82, unit: 'bpm' },
 *   { metric: 'spo2', value: 97, unit: '%' },
 *   { metric: 'temperature', value: 37.2, unit: '°C' }
 * ])
 */
export const insertReadings = async (patientId, readings) => {
  try {
    const insertedReadings = [];
    for (const reading of readings) {
      const inserted = await insertReading(
        patientId,
        reading.metric,
        reading.value,
        reading.unit
      );
      insertedReadings.push(inserted);
    }
    return insertedReadings;
  } catch (error) {
    console.error('Error inserting readings:', error);
    throw error;
  }
};

/**
 * Get the latest reading for each metric for a patient
 * Useful for dashboard displays when WebSocket temporarily unavailable
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Promise<Array>} Latest readings for each metric
 */
export const getLatestReadings = async (patientId) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (metric) 
        id, metric, value, unit, timestamp
       FROM readings
       WHERE patient_id = $1
       ORDER BY metric, timestamp DESC`,
      [patientId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting latest readings:', error);
    throw error;
  }
};

/**
 * Get readings for a specific metric within a time range
 * Used for generating charts and history views
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} metric - Metric name
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @returns {Promise<Array>} Readings in time range
 */
export const getReadingsByMetricTimeRange = async (patientId, metric, startTime, endTime) => {
  try {
    const result = await pool.query(
      `SELECT * FROM readings
       WHERE patient_id = $1 
       AND metric = $2 
       AND timestamp BETWEEN $3 AND $4
       ORDER BY timestamp DESC`,
      [patientId, metric, startTime, endTime]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting readings by time range:', error);
    throw error;
  }
};

/**
 * Get patient vitals summary for overview screens
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Promise<Object>} Patient info with latest readings
 */
export const getPatientVitalsSummary = async (patientId) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.bed,
        p.created_at,
        json_agg(
          json_build_object(
            'metric', r.metric,
            'value', r.value,
            'unit', r.unit,
            'timestamp', r.timestamp
          )
        ) as latest_vitals
       FROM patients p
       LEFT JOIN LATERAL (
         SELECT DISTINCT ON (metric) metric, value, unit, timestamp
         FROM readings
         WHERE patient_id = p.id
         ORDER BY metric, timestamp DESC
       ) r ON true
       WHERE p.id = $1
       GROUP BY p.id, p.name, p.bed, p.created_at`,
      [patientId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting patient vitals summary:', error);
    throw error;
  }
};

/**
 * Get recent readings across all patients (for system dashboard)
 * 
 * @param {number} limit - Number of recent readings to fetch (default: 50)
 * @returns {Promise<Array>} Recent readings from all patients
 */
export const getRecentReadings = async (limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT r.*, p.name, p.bed
       FROM readings r
       JOIN patients p ON r.patient_id = p.id
       ORDER BY r.timestamp DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting recent readings:', error);
    throw error;
  }
};

/**
 * Check if patient exists
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Promise<boolean>} True if patient exists
 */
export const patientExists = async (patientId) => {
  try {
    const result = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking patient existence:', error);
    throw error;
  }
};

/**
 * Get reading statistics for a metric over a time range
 * Useful for analytics and alerts
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} metric - Metric name
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @returns {Promise<Object>} Stats: min, max, avg, count
 */
export const getReadingStats = async (patientId, metric, startTime, endTime) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as count,
        MIN(value) as min_value,
        MAX(value) as max_value,
        AVG(value) as avg_value,
        STDDEV_POP(value) as stddev
       FROM readings
       WHERE patient_id = $1 
       AND metric = $2 
       AND timestamp BETWEEN $3 AND $4`,
      [patientId, metric, startTime, endTime]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting reading statistics:', error);
    throw error;
  }
};

export default {
  insertReading,
  insertReadings,
  getLatestReadings,
  getReadingsByMetricTimeRange,
  getPatientVitalsSummary,
  getRecentReadings,
  patientExists,
  getReadingStats
};
