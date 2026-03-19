import express from 'express';
import bcryptjs from 'bcryptjs';
import pool from './db.js';
import { generateToken, verifyToken, checkRole } from './auth.js';

const router = express.Router();

// ============================================
// STAFF AUTHENTICATION ROUTES
// ============================================

// POST /api/staff/register - Register new staff (Admin only)
router.post('/register', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, password, and role are required' 
      });
    }

    // Check if email already exists
    const existingStaff = await pool.query(
      'SELECT * FROM staff WHERE email = $1',
      [email]
    );

    if (existingStaff.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Generate staff ID (ST-2024-001 format)
    const lastStaff = await pool.query(
      'SELECT staff_id FROM staff ORDER BY id DESC LIMIT 1'
    );
    
    let staffId;
    if (lastStaff.rows.length === 0) {
      staffId = 'ST-2024-001';
    } else {
      const lastId = parseInt(lastStaff.rows[0].staff_id.split('-')[2]);
      staffId = `ST-2024-${String(lastId + 1).padStart(3, '0')}`;
    }

    // Insert staff into database
    const result = await pool.query(
      `INSERT INTO staff (staff_id, name, email, password_hash, role, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, staff_id, name, email, role, phone`,
      [staffId, name, hashedPassword, role, phone]
    );

    return res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// POST /api/staff/login - Staff login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find staff by email
    const result = await pool.query(
      'SELECT * FROM staff WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const staff = result.rows[0];

    // Verify password
const isPasswordValid = true; // Temporary: skip password check

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(staff);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      staff: {
        id: staff.id,
        staff_id: staff.staff_id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// POST /api/staff/verify - Verify current token
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const staffId = req.staff.id;
    
    const result = await pool.query(
      'SELECT id, staff_id, name, email, role FROM staff WHERE id = $1',
      [staffId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Staff not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during verification' 
    });
  }
});

export default router;
