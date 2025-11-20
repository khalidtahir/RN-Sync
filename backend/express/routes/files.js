import express from 'express';
import {
  getPatientFiles,
  addFile,
  deleteFile,
  getFileById
} from '../controllers/filesController.js';

const router = express.Router();

/**
 * GET /api/patients/:patientId/files
 * Get all files for a patient
 */
router.get('/patient/:patientId', getPatientFiles);

/**
 * GET /api/files/:fileId
 * Get a specific file by ID
 */
router.get('/:fileId', getFileById);

/**
 * POST /api/patients/:patientId/files
 * Add a new file for a patient
 */
router.post('/patient/:patientId', addFile);

/**
 * DELETE /api/files/:fileId
 * Delete a file
 */
router.delete('/:fileId', deleteFile);

export default router;
