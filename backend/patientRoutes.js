import express from 'express';
import pool from './db.js';
import { verifyToken, checkRole } from './auth.js';

const router = express.Router();

// ============================================
// PATIENT MANAGEMENT ROUTES
// ============================================

// POST /api/patients - Create new patient
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      date_of_birth,
      age,
      gender,
      blood_group,
      address,
      city,
      state,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      referred_by
    } = req.body;

    // Validate required fields
    if (!first_name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name and phone are required'
      });
    }

    // Check if patient with same phone already exists
    const existingPatient = await pool.query(
      'SELECT id FROM patients WHERE phone = $1',
      [phone]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists'
      });
    }

    // Generate patient ID (PT-2024-001 format)
    const lastPatient = await pool.query(
      'SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1'
    );

    let patientId;
    if (lastPatient.rows.length === 0) {
      patientId = 'PT-2024-001';
    } else {
      const lastId = parseInt(lastPatient.rows[0].patient_id.split('-')[2]);
      patientId = `PT-2024-${String(lastId + 1).padStart(3, '0')}`;
    }

    // Insert patient into database
    const result = await pool.query(
      `INSERT INTO patients (
        patient_id, first_name, last_name, phone, email, date_of_birth, age,
        gender, blood_group, address, city, state, postal_code,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, referred_by, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, patient_id, first_name, last_name, phone, email, age, blood_group, gender, created_at`,
      [
        patientId, first_name, last_name, phone, email, date_of_birth, age,
        gender, blood_group, address, city, state, postal_code,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, referred_by, req.staff.id
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Patient creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during patient registration'
    });
  }
});

// GET /api/patients - Get all patients (with search and pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM patients WHERE is_active = true';
    let params = [];

    // Add search filter
    if (search) {
      query += ` AND (first_name ILIKE $${params.length + 1} 
                    OR last_name ILIKE $${params.length + 2}
                    OR phone ILIKE $${params.length + 3}
                    OR patient_id ILIKE $${params.length + 4})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await pool.query(countQuery, params);
    const totalPatients = parseInt(countResult.rows[0].total);

    // Add pagination and ordering
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalPatients,
        pages: Math.ceil(totalPatients / limit)
      }
    });
  } catch (error) {
    console.error('Patient fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by patient_id or database id
    let result = await pool.query(
      'SELECT * FROM patients WHERE patient_id = $1 OR id = $2',
      [id, parseInt(id) || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Patient detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching patient'
    });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      date_of_birth,
      age,
      gender,
      blood_group,
      address,
      city,
      state,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      referred_by
    } = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      fields.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }
    if (last_name !== undefined) {
      fields.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${paramCount}`);
      values.push(date_of_birth);
      paramCount++;
    }
    if (age !== undefined) {
      fields.push(`age = $${paramCount}`);
      values.push(age);
      paramCount++;
    }
    if (gender !== undefined) {
      fields.push(`gender = $${paramCount}`);
      values.push(gender);
      paramCount++;
    }
    if (blood_group !== undefined) {
      fields.push(`blood_group = $${paramCount}`);
      values.push(blood_group);
      paramCount++;
    }
    if (address !== undefined) {
      fields.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }
    if (city !== undefined) {
      fields.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    if (state !== undefined) {
      fields.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }
    if (postal_code !== undefined) {
      fields.push(`postal_code = $${paramCount}`);
      values.push(postal_code);
      paramCount++;
    }
    if (emergency_contact_name !== undefined) {
      fields.push(`emergency_contact_name = $${paramCount}`);
      values.push(emergency_contact_name);
      paramCount++;
    }
    if (emergency_contact_phone !== undefined) {
      fields.push(`emergency_contact_phone = $${paramCount}`);
      values.push(emergency_contact_phone);
      paramCount++;
    }
    if (medical_history !== undefined) {
      fields.push(`medical_history = $${paramCount}`);
      values.push(medical_history);
      paramCount++;
    }
    if (allergies !== undefined) {
      fields.push(`allergies = $${paramCount}`);
      values.push(allergies);
      paramCount++;
    }
    if (referred_by !== undefined) {
      fields.push(`referred_by = $${paramCount}`);
      values.push(referred_by);
      paramCount++;
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    values.push(parseInt(id) || null);

    const query = `
      UPDATE patients
      SET ${fields.join(', ')}
      WHERE patient_id = $${paramCount} OR id = $${paramCount + 1}
      RETURNING id, patient_id, first_name, last_name, phone, email, age, blood_group
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Patient update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating patient'
    });
  }
});

// DELETE /api/patients/:id - Soft delete patient (mark as inactive)
router.delete('/:id', verifyToken, checkRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE patients SET is_active = false WHERE patient_id = $1 OR id = $2 RETURNING patient_id',
      [id, parseInt(id) || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Patient delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting patient'
    });
  }
});

export default router;
