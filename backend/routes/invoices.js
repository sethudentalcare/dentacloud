const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/invoices - Create invoice
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { patient_id, items, discount_percentage, tax_percentage } = req.body;

        if (!patient_id || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Patient ID and items required' });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const discount_amount = (subtotal * (discount_percentage || 0)) / 100;
        const taxable_amount = subtotal - discount_amount;
        const tax_amount = (taxable_amount * (tax_percentage || 0)) / 100;
        const total_amount = taxable_amount + tax_amount;

        // Generate invoice number
        const idResult = await pool.query('SELECT nextval(\'invoice_id_seq\') as invoice_seq');
        const invoiceSeq = idResult.rows[0].invoice_seq;
        const invoiceNumber = `INV-${String(invoiceSeq).padStart(5, '0')}`;

        // Create invoice
        const invoiceResult = await pool.query(
            `INSERT INTO invoices (
                invoice_number, patient_id, invoice_date, subtotal, 
                discount_percentage, discount_amount, tax_percentage, tax_amount,
                total_amount, outstanding_amount, status, created_by_id
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
             RETURNING *`,
            [invoiceNumber, patient_id, subtotal, discount_percentage, discount_amount,
             tax_percentage, tax_amount, total_amount, total_amount, req.userId]
        );

        const invoiceId = invoiceResult.rows[0].id;

        // Add invoice items
        for (const item of items) {
            await pool.query(
                `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [invoiceId, item.description, item.quantity, item.unit_price, item.unit_price * item.quantity]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice: invoiceResult.rows[0]
        });

    } catch (error) {
        console.error('Invoice creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create invoice' });
    }
});

// GET /api/invoices - Get all invoices
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT i.*, p.first_name, p.last_name, p.phone 
             FROM invoices i
             JOIN patients p ON i.patient_id = p.id
             WHERE i.status != 'cancelled'
             ORDER BY i.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM invoices WHERE status != \'cancelled\''
        );

        res.json({
            success: true,
            invoices: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
    }
});

// GET /api/invoices/:id - Get invoice details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const invoiceResult = await pool.query(
            `SELECT i.*, p.first_name, p.last_name, p.phone, p.email
             FROM invoices i
             JOIN patients p ON i.patient_id = p.id
             WHERE i.id = $1`,
            [req.params.id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        const itemsResult = await pool.query(
            'SELECT * FROM invoice_items WHERE invoice_id = $1',
            [req.params.id]
        );

        res.json({
            success: true,
            invoice: invoiceResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
    }
});

// POST /api/payments - Record payment
router.post('/payments', authenticateToken, async (req, res) => {
    try {
        const { invoice_id, patient_id, payment_amount, payment_method, reference_number } = req.body;

        if (!invoice_id || !payment_amount) {
            return res.status(400).json({ success: false, error: 'Invoice ID and payment amount required' });
        }

        // Generate payment ID
        const idResult = await pool.query('SELECT nextval(\'payment_id_seq\') as payment_seq');
        const paymentSeq = idResult.rows[0].payment_seq;
        const paymentId = `PAY-${String(paymentSeq).padStart(5, '0')}`;

        // Record payment
        const paymentResult = await pool.query(
            `INSERT INTO payments (
                payment_id, invoice_id, patient_id, payment_amount, payment_date,
                payment_method, reference_number, created_by_id
            ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7)
             RETURNING *`,
            [paymentId, invoice_id, patient_id, payment_amount, payment_method, reference_number, req.userId]
        );

        // Update invoice
        const invoiceResult = await pool.query(
            `SELECT paid_amount, outstanding_amount, total_amount FROM invoices WHERE id = $1`,
            [invoice_id]
        );

        const newPaidAmount = invoiceResult.rows[0].paid_amount + payment_amount;
        const newOutstandingAmount = invoiceResult.rows[0].total_amount - newPaidAmount;
        const newStatus = newOutstandingAmount <= 0 ? 'paid' : 'partial';

        await pool.query(
            `UPDATE invoices SET paid_amount = $1, outstanding_amount = $2, status = $3 WHERE id = $4`,
            [newPaidAmount, Math.max(0, newOutstandingAmount), newStatus, invoice_id]
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            payment: paymentResult.rows[0]
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, error: 'Failed to record payment' });
    }
});

module.exports = router;