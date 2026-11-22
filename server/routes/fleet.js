const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create drivers table automatically if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    driver_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) DEFAULT '',
    vehicle_number VARCHAR(50) NOT NULL,
    tank_capacity NUMERIC(10, 2) NOT NULL DEFAULT 60,
    monthly_limit_liters NUMERIC(10, 2) NOT NULL DEFAULT 300,
    used_liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    allowed_start_time VARCHAR(10) DEFAULT '06:00',
    allowed_end_time VARCHAR(10) DEFAULT '22:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    qr_payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating drivers table:', err));

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         driver_name AS "driverName",
         phone,
         vehicle_number AS "vehicleNumber",
         tank_capacity AS "tankCapacity",
         monthly_limit_liters AS "monthlyLimitLiters",
         used_liters AS "usedLiters",
         allowed_start_time AS "allowedStartTime",
         allowed_end_time AS "allowedEndTime",
         is_active AS "isActive",
         qr_payload AS "qrPayload"
       FROM drivers
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

// Add a new driver with signed/structured QR payload
router.post('/add', async (req, res) => {
  try {
    const {
      driverName,
      phone,
      vehicleNumber,
      tankCapacity,
      monthlyLimitLiters,
      allowedStartTime,
      allowedEndTime,
    } = req.body;

    const qrPayload = JSON.stringify({
      system: 'PumpSync',
      driverName,
      vehicleNumber,
      issuedAt: Date.now(),
    });

    const result = await pool.query(
      `INSERT INTO drivers (
         driver_name, phone, vehicle_number, tank_capacity,
         monthly_limit_liters, used_liters, allowed_start_time, allowed_end_time,
         is_active, qr_payload
       )
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, TRUE, $8)
       RETURNING
         id,
         driver_name AS "driverName",
         phone,
         vehicle_number AS "vehicleNumber",
         tank_capacity AS "tankCapacity",
         monthly_limit_liters AS "monthlyLimitLiters",
         used_liters AS "usedLiters",
         allowed_start_time AS "allowedStartTime",
         allowed_end_time AS "allowedEndTime",
         is_active AS "isActive",
         qr_payload AS "qrPayload"`,
      [
        driverName,
        phone || '',
        vehicleNumber,
        Number(tankCapacity) || 60,
        Number(monthlyLimitLiters) || 300,
        allowedStartTime || '06:00',
        allowedEndTime || '22:00',
        qrPayload,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding driver:', error);
    res.status(500).json({ message: 'Error adding driver' });
  }
});

// Toggle active / inactive status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE drivers
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, is_active AS "isActive"`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Error updating driver status' });
  }
});
// Delete a driver by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Error deleting driver' });
  }
});
module.exports = router;