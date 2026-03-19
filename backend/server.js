import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import staffRoutes from './staffRoutes.js';
import patientRoutes from './patientRoutes.js';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (CSS, JS, HTML)
app.use(express.static(__dirname));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DentaCloud API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Staff routes (authentication)
app.use('/api/staff', staffRoutes);

// Patient routes
app.use('/api/patients', patientRoutes);

// API status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'running',
    message: 'DentaCloud Backend API v1.0.0',
    modules: [
      'Authentication',
      'Patient Management'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       🦷 DENTACLOUD API v1.0.0        ║
║     Dental Clinic Management System    ║
╚════════════════════════════════════════╝

Server Status: ✅ RUNNING
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}

API Base URL: http://localhost:${PORT}
Frontend: http://localhost:${PORT}

Ready to receive requests! 🚀
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});