const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'DentaCloud API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        version: '1.0.0',
        phase: 'Phase 1',
        features: ['Authentication', 'Patient Management', 'Billing'],
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/invoices', require('./routes/invoices'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found',
        path: req.path 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;