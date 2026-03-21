const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║     🦷 DentaCloud API Server Started          ║
╚═══════════════════════════════════════════════╝

Server Information:
- 🚀 Port: ${PORT}
- 📍 Environment: ${process.env.NODE_ENV || 'development'}
- 🗄️  Database: Connected to Neon
- 🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}

Endpoints:
- /health - Health check
- /api/status - API status
- /api/auth/login - User login
- /api/auth/logout - User logout
- /api/patients - Patient management
- /api/invoices - Billing/Invoices

Database:
- Neon PostgreSQL

Visit: http://localhost:${PORT}/health
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});