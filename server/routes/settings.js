const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create station_settings table and insert a default row if empty
const initSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS station_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        station_name VARCHAR(150) NOT NULL DEFAULT 'PumpSync Fuel Station',
        manager_name VARCHAR(100) NOT NULL DEFAULT 'Admin',
        phone VARCHAR(30) DEFAULT '',
        address TEXT DEFAULT '',
        low_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 1000,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const check = await pool.query('SELECT * FROM station_settings WHERE id = 1');
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO station_settings (id, station_name, manager_name, phone, address, low_stock_alert)
         VALUES (1, 'PumpSync Fuel Station', 'Admin', '0300-0000000', 'Main GT Road', 1000)`
      );
    }
  } catch (err) {
    console.error('Error initializing station_settings table:', err);
  }
};

initSettingsTable();

// Get current settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT station_name AS "stationName", manager_name AS "managerName", phone, address, low_stock_alert AS "lowStockAlert", updated_at AS "updatedAt" FROM station_settings WHERE id = 1'
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update settings
router.put('/update', async (req, res) => {
  try {
    const { stationName, managerName, phone, address, lowStockAlert } = req.body;
    const result = await pool.query(
      `UPDATE station_settings
       SET station_name = $1, manager_name = $2, phone = $3, address = $4, low_stock_alert = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING station_name AS "stationName", manager_name AS "managerName", phone, address, low_stock_alert AS "lowStockAlert"`,
      [stationName, managerName, phone, address, lowStockAlert]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;