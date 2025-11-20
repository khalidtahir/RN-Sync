import express from 'express';
import patientRoutes from './routes/patients.js';
import fileRoutes from './routes/files.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'RN-Sync Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/files', fileRoutes);

// Alternate file route for convenience
app.get('/api/patients/:patientId/files', (req, res, next) => {
  req.params.patientId = req.params.patientId;
  // Import here to avoid circular dependency
  import('./controllers/filesController.js').then(module => {
    module.getPatientFiles(req, res);
  });
});

app.post('/api/patients/:patientId/files', (req, res, next) => {
  req.params.patientId = req.params.patientId;
  import('./controllers/filesController.js').then(module => {
    module.addFile(req, res);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

export default app;
