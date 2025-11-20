import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all patients
 * GET /api/patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.bed,
        p.created_at,
        (SELECT value FROM readings WHERE patient_id = p.id ORDER BY timestamp DESC LIMIT 1) as latest_vital,
        (SELECT metric FROM readings WHERE patient_id = p.id ORDER BY timestamp DESC LIMIT 1) as latest_metric
      FROM patients p
      ORDER BY p.created_at DESC`
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

/**
 * Get single patient by ID
 * GET /api/patients/:id
 */
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get patient info
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patient = patientResult.rows[0];
    
    // Get latest readings
    const readingsResult = await pool.query(
      `SELECT DISTINCT ON (metric) 
        id, metric, value, unit, timestamp
       FROM readings
       WHERE patient_id = $1
       ORDER BY metric, timestamp DESC`,
      [id]
    );
    
    res.status(200).json({
      success: true,
      data: {
        ...patient,
        latest_readings: readingsResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
};

/**
 * Get patient reading history with optional date range
 * GET /api/patients/:id/history?from=timestamp&to=timestamp&metric=heart_rate
 */
export const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, metric } = req.query;
    
    let query = 'SELECT * FROM readings WHERE patient_id = $1';
    const params = [id];
    let paramIndex = 2;
    
    // Validate patient exists
    const patientCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [id]
    );
    
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    if (from) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(new Date(from));
      paramIndex++;
    }
    
    if (to) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(new Date(to));
      paramIndex++;
    }
    
    if (metric) {
      query += ` AND metric = $${paramIndex}`;
      params.push(metric);
      paramIndex++;
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting patient history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient history',
      error: error.message
    });
  }
};

/**
 * Create a new patient
 * POST /api/patients
 * Body: { name: string, bed: string }
 */
export const createPatient = async (req, res) => {
  try {
    const { name, bed } = req.body;
    
    // Validation
    if (!name || !bed) {
      return res.status(400).json({
        success: false,
        message: 'Name and bed are required'
      });
    }
    
    const id = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO patients (id, name, bed) VALUES ($1, $2, $3) RETURNING *',
      [id, name, bed]
    );
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message
    });
  }
};

/**
 * Insert a new reading for a patient
 * POST /api/patients/:id/readings
 * Body: { metric: string, value: number, unit: string }
 */
export const addReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { metric, value, unit } = req.body;
    
    // Validation
    if (!metric || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Metric and value are required'
      });
    }
    
    // Check patient exists
    const patientCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [id]
    );
    
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const readingId = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO readings (id, patient_id, metric, value, unit, timestamp) VALUES ($1, $2, $3, $4, $5, now()) RETURNING *',
      [readingId, id, metric, value, unit]
    );
    
    res.status(201).json({
      success: true,
      message: 'Reading added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding reading:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reading',
      error: error.message
    });
  }
};
