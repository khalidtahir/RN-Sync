import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all files for a patient
 * GET /api/patients/:id/files
 */
export const getPatientFiles = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify patient exists
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
    
    const result = await pool.query(
      'SELECT id, file_name, file_type, storage_url, uploaded_at FROM files WHERE patient_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting patient files:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient files',
      error: error.message
    });
  }
};

/**
 * Add file metadata for a patient
 * POST /api/patients/:id/files
 * Body: { file_name: string, file_type: string, storage_url: string }
 */
export const addFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_type, storage_url } = req.body;
    
    // Validation
    if (!file_name || !storage_url) {
      return res.status(400).json({
        success: false,
        message: 'file_name and storage_url are required'
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
    
    const fileId = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO files (id, patient_id, file_name, file_type, storage_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fileId, id, file_name, file_type, storage_url]
    );
    
    res.status(201).json({
      success: true,
      message: 'File added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding file:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding file',
      error: error.message
    });
  }
};

/**
 * Delete a file
 * DELETE /api/files/:fileId
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM files WHERE id = $1 RETURNING *',
      [fileId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

/**
 * Get file by ID
 * GET /api/files/:fileId
 */
export const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
};
