const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create tables for shift reconciliation, 5L calibration logs, and theft alerts
pool.query(`
  CREATE TABLE IF NOT EXISTS shift_reconciliations (
    id SERIAL PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    nozzle_label VARCHAR(100) NOT NULL,
    opening_reading NUMERIC(12, 2) NOT NULL DEFAULT 0,
    closing_reading NUMERIC(12, 2) NOT NULL DEFAULT 0,
    system_dispensed_liters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    variance_liters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    variance_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating shift_reconciliations table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS calibration_logs (
    id SERIAL PRIMARY KEY,
    nozzle_label VARCHAR(100) NOT NULL,
    standard_liters NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    measured_liters NUMERIC(10, 2) NOT NULL,
    variance_liters NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pass',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating calibration_logs table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS theft_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating theft_alerts table:', err));

// Get all reconciliation data, 5L calibrations, and alerts
router.get('/overview', async (req, res) => {
  try {
    const [shiftsRes, calRes, alertsRes, txSummaryRes] = await Promise.all([
      pool.query(
        `SELECT
           id,
           shift_name AS "shiftName",
           nozzle_label AS "nozzleLabel",
           opening_reading AS "openingReading",
           closing_reading AS "closingReading",
           system_dispensed_liters AS "systemDispensedLiters",
           cash_collected AS "cashCollected",
           expected_cash AS "expectedCash",
           variance_liters AS "varianceLiters",
           variance_cash AS "varianceCash",
           notes,
           created_at AS "createdAt"
         FROM shift_reconciliations
         ORDER BY id DESC
         LIMIT 20`
      ),
      pool.query(
        `SELECT
           id,
           nozzle_label AS "nozzleLabel",
           standard_liters AS "standardLiters",
           measured_liters AS "measuredLiters",
           variance_liters AS "varianceLiters",
           status,
           notes,
           created_at AS "createdAt"
         FROM calibration_logs
         ORDER BY id DESC
         LIMIT 20`
      ),
      pool.query(
        `SELECT
           id,
           alert_type AS "alertType",
           severity,
           description,
           is_resolved AS "isResolved",
           created_at AS "createdAt"
         FROM theft_alerts
         ORDER BY id DESC
         LIMIT 30`
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(liters), 0) AS "totalDispensedLiters",
           COALESCE(SUM(total_amount), 0) AS "totalDispensedAmount"
         FROM fuel_transactions`
      ),
    ]);

    res.json({
      shifts: shiftsRes.rows,
      calibrations: calRes.rows,
      alerts: alertsRes.rows,
      summary: txSummaryRes.rows[0] || { totalDispensedLiters: 0, totalDispensedAmount: 0 },
    });
  } catch (error) {
    console.error('Error loading reconciliation overview:', error);
    res.status(500).json({ message: 'Error loading reconciliation overview.' });
  }
});

// Save a shift reconciliation record (and flag alert if variance is significant)
router.post('/shifts', async (req, res) => {
  try {
    const {
      shiftName,
      nozzleLabel,
      openingReading,
      closingReading,
      cashCollected,
      ratePerLiter,
      notes,
    } = req.body;

    const openVal = Number(openingReading);
    const closeVal = Number(closingReading);
    const cashVal = Number(cashCollected) || 0;
    const rateVal = Number(ratePerLiter) || 260;

    if (!shiftName || !nozzleLabel || Number.isNaN(openVal) || Number.isNaN(closeVal)) {
      return res.status(400).json({ message: 'Shift name, nozzle, and valid meter readings are required.' });
    }

    if (closeVal < openVal) {
      return res.status(400).json({ message: 'Closing reading cannot be less than opening reading.' });
    }

    const meterLiters = Number((closeVal - openVal).toFixed(2));
    const txRes = await pool.query(
      `SELECT COALESCE(SUM(liters), 0) AS "sysLiters", COALESCE(SUM(total_amount), 0) AS "sysAmount"
       FROM fuel_transactions`
    );
    const systemDispensedLiters = Number(txRes.rows[0].sysLiters) || 0;
    const expectedCash = Number((meterLiters * rateVal).toFixed(2));
    const varianceLiters = Number((meterLiters - systemDispensedLiters).toFixed(2));
    const varianceCash = Number((cashVal - expectedCash).toFixed(2));

    const insertRes = await pool.query(
      `INSERT INTO shift_reconciliations
         (shift_name, nozzle_label, opening_reading, closing_reading, system_dispensed_liters, cash_collected, expected_cash, variance_liters, variance_cash, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING
         id,
         shift_name AS "shiftName",
         nozzle_label AS "nozzleLabel",
         opening_reading AS "openingReading",
         closing_reading AS "closingReading",
         system_dispensed_liters AS "systemDispensedLiters",
         cash_collected AS "cashCollected",
         expected_cash AS "expectedCash",
         variance_liters AS "varianceLiters",
         variance_cash AS "varianceCash",
         notes,
         created_at AS "createdAt"`,
      [
        shiftName.trim(),
        nozzleLabel.trim(),
        openVal,
        closeVal,
        systemDispensedLiters,
        cashVal,
        expectedCash,
        varianceLiters,
        varianceCash,
        notes || '',
      ]
    );

    // Trigger theft/shortage alert if cash shortfall or meter variance exceeds threshold
    if (varianceCash < -500 || Math.abs(varianceLiters) > 10) {
      await pool.query(
        `INSERT INTO theft_alerts (alert_type, severity, description)
         VALUES ($1, $2, $3)`,
        [
          'Shift Variance Alert',
          'High',
          `${shiftName} (${nozzleLabel}): Meter liters ${meterLiters}L vs System ${systemDispensedLiters}L (Var: ${varianceLiters}L), Cash variance: ${varianceCash}.`,
        ]
      );
    }

    res.status(201).json({
      message: 'Shift reconciliation saved.',
      shift: insertRes.rows[0],
    });
  } catch (error) {
    console.error('Error saving shift reconciliation:', error);
    res.status(500).json({ message: 'Error saving shift reconciliation.' });
  }
});

// Log a 5L calibration check
router.post('/calibrations', async (req, res) => {
  try {
    const { nozzleLabel, measuredLiters, notes } = req.body;
    const measured = Number(measuredLiters);
    const standard = 5.0;

    if (!nozzleLabel || !measured || measured <= 0) {
      return res.status(400).json({ message: 'Nozzle label and positive measured liters are required.' });
    }

    const varianceLiters = Number((measured - standard).toFixed(2));
    const isPass = Math.abs(varianceLiters) <= 0.1;
    const status = isPass ? 'Pass' : 'Out of Tolerance';

    const insertRes = await pool.query(
      `INSERT INTO calibration_logs
         (nozzle_label, standard_liters, measured_liters, variance_liters, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         nozzle_label AS "nozzleLabel",
         standard_liters AS "standardLiters",
         measured_liters AS "measuredLiters",
         variance_liters AS "varianceLiters",
         status,
         notes,
         created_at AS "createdAt"`,
      [nozzleLabel.trim(), standard, measured, varianceLiters, status, notes || '']
    );

    if (!isPass) {
      await pool.query(
        `INSERT INTO theft_alerts (alert_type, severity, description)
         VALUES ($1, $2, $3)`,
        [
          '5L Calibration Drift',
          'Medium',
          `${nozzleLabel} measured ${measured}L on 5.00L test (Variance: ${varianceLiters > 0 ? '+' : ''}${varianceLiters}L).`,
        ]
      );
    }

    res.status(201).json({
      message: `5L calibration recorded (${status}).`,
      calibration: insertRes.rows[0],
    });
  } catch (error) {
    console.error('Error logging 5L calibration:', error);
    res.status(500).json({ message: 'Error logging calibration.' });
  }
});

// Add a manual suspicious activity / theft alert
router.post('/alerts', async (req, res) => {
  try {
    const { alertType, severity, description } = req.body;
    if (!alertType || !description) {
      return res.status(400).json({ message: 'Alert type and description are required.' });
    }

    const insertRes = await pool.query(
      `INSERT INTO theft_alerts (alert_type, severity, description)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         alert_type AS "alertType",
         severity,
         description,
         is_resolved AS "isResolved",
         created_at AS "createdAt"`,
      [alertType.trim(), severity || 'High', description.trim()]
    );

    res.status(201).json({
      message: 'Suspicious activity alert logged.',
      alert: insertRes.rows[0],
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Error creating alert.' });
  }
});

// Resolve an alert
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const updRes = await pool.query(
      `UPDATE theft_alerts
       SET is_resolved = TRUE
       WHERE id = $1
       RETURNING id, is_resolved AS "isResolved"`,
      [id]
    );

    if (updRes.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.json({ message: 'Alert marked as resolved.' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert.' });
  }
});
// Delete a shift reconciliation entry
router.delete('/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await pool.query(
      'DELETE FROM shift_reconciliations WHERE id = $1 RETURNING id',
      [id]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: 'Shift record not found.' });
    }

    res.json({ message: 'Shift reconciliation deleted.' });
  } catch (error) {
    console.error('Error deleting shift record:', error);
    res.status(500).json({ message: 'Error deleting shift record.' });
  }
});

// Delete a 5L calibration log entry
router.delete('/calibrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await pool.query(
      'DELETE FROM calibration_logs WHERE id = $1 RETURNING id',
      [id]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: 'Calibration log not found.' });
    }

    res.json({ message: 'Calibration log deleted.' });
  } catch (error) {
    console.error('Error deleting calibration log:', error);
    res.status(500).json({ message: 'Error deleting calibration log.' });
  }
});

// Delete a theft / audit alert entry
router.delete('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await pool.query(
      'DELETE FROM theft_alerts WHERE id = $1 RETURNING id',
      [id]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.json({ message: 'Alert deleted.' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Error deleting alert.' });
  }
});
module.exports = router;