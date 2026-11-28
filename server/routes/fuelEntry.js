const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create fuel_transactions table automatically if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS fuel_transactions (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    liters NUMERIC(10, 2) NOT NULL,
    rate_per_liter NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    odometer_reading NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating fuel_transactions table:', err));

// Helper to check if current HH:MM is inside allowed window
function isWithinTimeWindow(startStr, endStr) {
  if (!startStr || !endStr) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  // Handles overnight windows like 20:00 to 04:00
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

// Lookup driver by QR payload or driver ID
router.post('/lookup', async (req, res) => {
  try {
    const { qrData, driverId } = req.body;
    let driverQuery;

    if (driverId) {
      driverQuery = await pool.query(
        `SELECT
           id,
           driver_name AS "driverName",
           vehicle_number AS "vehicleNumber",
           tank_capacity AS "tankCapacity",
           monthly_limit_liters AS "monthlyLimitLiters",
           used_liters AS "usedLiters",
           allowed_start_time AS "allowedStartTime",
           allowed_end_time AS "allowedEndTime",
           is_active AS "isActive"
         FROM drivers
         WHERE id = $1`,
        [driverId]
      );
    } else if (qrData) {
      let parsed = null;
      try {
        parsed = JSON.parse(qrData);
      } catch (_) {
        parsed = null;
      }

      if (parsed && parsed.vehicleNumber) {
        driverQuery = await pool.query(
          `SELECT
             id,
             driver_name AS "driverName",
             vehicle_number AS "vehicleNumber",
             tank_capacity AS "tankCapacity",
             monthly_limit_liters AS "monthlyLimitLiters",
             used_liters AS "usedLiters",
             allowed_start_time AS "allowedStartTime",
             allowed_end_time AS "allowedEndTime",
             is_active AS "isActive"
           FROM drivers
           WHERE LOWER(vehicle_number) = LOWER($1)
           ORDER BY id DESC LIMIT 1`,
          [parsed.vehicleNumber]
        );
      } else {
        driverQuery = await pool.query(
          `SELECT
             id,
             driver_name AS "driverName",
             vehicle_number AS "vehicleNumber",
             tank_capacity AS "tankCapacity",
             monthly_limit_liters AS "monthlyLimitLiters",
             used_liters AS "usedLiters",
             allowed_start_time AS "allowedStartTime",
             allowed_end_time AS "allowedEndTime",
             is_active AS "isActive"
           FROM drivers
           WHERE qr_payload = $1
           LIMIT 1`,
          [qrData]
        );
      }
    } else {
      return res.status(400).json({ message: 'QR data or driver ID is required.' });
    }

    if (driverQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found for this QR code.' });
    }

    const driver = driverQuery.rows[0];
    const remainingLimit = Math.max(0, Number(driver.monthlyLimitLiters) - Number(driver.usedLiters));
    const timeAllowed = isWithinTimeWindow(driver.allowedStartTime, driver.allowedEndTime);

    res.json({
      ...driver,
      remainingLimit: Number(remainingLimit.toFixed(2)),
      timeAllowed,
    });
  } catch (error) {
    console.error('Error looking up driver QR:', error);
    res.status(500).json({ message: 'Error looking up driver.' });
  }
});

// Process fuel entry with validation and row-locked balance deduction
router.post('/dispense', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId, liters, ratePerLiter, odometerReading } = req.body;
    const fuelLiters = Number(liters);
    const rate = Number(ratePerLiter) || 0;
    const odometer = Number(odometerReading) || 0;

    if (!driverId || !fuelLiters || fuelLiters <= 0) {
      client.release();
      return res.status(400).json({ message: 'Valid driver and positive fuel liters are required.' });
    }

    await client.query('BEGIN');

    const driverRes = await client.query(
      'SELECT * FROM drivers WHERE id = $1 FOR UPDATE',
      [driverId]
    );

    if (driverRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const driver = driverRes.rows[0];

    if (!driver.is_active) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Transaction rejected: Driver is inactive.' });
    }

    if (!isWithinTimeWindow(driver.allowed_start_time, driver.allowed_end_time)) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        message: `Transaction rejected: Outside allowed window (${driver.allowed_start_time} - ${driver.allowed_end_time}).`,
      });
    }

    if (fuelLiters > Number(driver.tank_capacity)) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        message: `Transaction rejected: Liters (${fuelLiters}L) exceed tank capacity (${driver.tank_capacity}L).`,
      });
    }

    const currentUsed = Number(driver.used_liters);
    const monthlyLimit = Number(driver.monthly_limit_liters);

    if (currentUsed + fuelLiters > monthlyLimit) {
      const left = Math.max(0, monthlyLimit - currentUsed).toFixed(2);
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        message: `Transaction rejected: Exceeds monthly limit. Remaining limit is ${left}L.`,
      });
    }

    const totalAmount = Number((fuelLiters * rate).toFixed(2));

    const updatedDriverRes = await client.query(
      `UPDATE drivers
       SET used_liters = used_liters + $1
       WHERE id = $2
       RETURNING used_liters AS "usedLiters", monthly_limit_liters AS "monthlyLimitLiters"`,
      [fuelLiters, driverId]
    );

    const txRes = await client.query(
      `INSERT INTO fuel_transactions
         (driver_id, vehicle_number, liters, rate_per_liter, total_amount, odometer_reading)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         driver_id AS "driverId",
         vehicle_number AS "vehicleNumber",
         liters,
         rate_per_liter AS "ratePerLiter",
         total_amount AS "totalAmount",
         odometer_reading AS "odometerReading",
         created_at AS "createdAt"`,
      [driverId, driver.vehicle_number, fuelLiters, rate, totalAmount, odometer]
    );

    await client.query('COMMIT');
    client.release();

    const u = updatedDriverRes.rows[0];
    res.status(201).json({
      message: 'Fuel dispensed and limit deducted successfully.',
      transaction: txRes.rows[0],
      remainingLimit: Number(Math.max(0, Number(u.monthlyLimitLiters) - Number(u.usedLiters)).toFixed(2)),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Error processing fuel dispense:', error);
    res.status(500).json({ message: 'Error processing fuel transaction.' });
  }
});

// Get recent fuel transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         d.driver_name AS "driverName",
         t.vehicle_number AS "vehicleNumber",
         t.liters,
         t.rate_per_liter AS "ratePerLiter",
         t.total_amount AS "totalAmount",
         t.odometer_reading AS "odometerReading",
         t.created_at AS "createdAt"
       FROM fuel_transactions t
       JOIN drivers d ON d.id = t.driver_id
       ORDER BY t.id DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions.' });
  }
});
// Delete a fuel transaction and restore driver's used_liters
router.delete('/transactions/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const txRes = await client.query(
      'DELETE FROM fuel_transactions WHERE id = $1 RETURNING driver_id, liters',
      [id]
    );

    if (txRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const { driver_id, liters } = txRes.rows[0];
    await client.query(
      `UPDATE drivers
       SET used_liters = GREATEST(0, used_liters - $1)
       WHERE id = $2`,
      [Number(liters), driver_id]
    );

    await client.query('COMMIT');
    client.release();

    res.json({ message: 'Transaction deleted and driver limit restored.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Error deleting fuel transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction.' });
  }
});
module.exports = router;