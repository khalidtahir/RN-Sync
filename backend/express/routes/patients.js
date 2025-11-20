import express from 'express';
import {
  getAllPatients,
  getPatientById,
  getPatientHistory,
  createPatient,
  addReading
} from '../controllers/patientsController.js';

const router = express.Router();

/**
 * GET /api/patients
 * Get all patients with their latest vital signs
 */
router.get('/', getAllPatients);

/**
 * POST /api/patients
 * Create a new patient
 */
router.post('/', createPatient);

/**
 * GET /api/patients/:id
 * Get patient by ID with latest readings
 */
router.get('/:id', getPatientById);

/**
 * GET /api/patients/:id/history
 * Get patient reading history with optional filters
 * Query params: from, to, metric
 */
router.get('/:id/history', getPatientHistory);

/**
 * POST /api/patients/:id/readings
 * Add a new reading for a patient
 */
router.post('/:id/readings', addReading);

export default router;
