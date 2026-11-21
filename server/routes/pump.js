const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create the station_pumps table automatically if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS station_pumps (
    id SERIAL PRIMARY KEY,
    pump_number VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating station_pumps table:', err));

// Add a new pump
router.post('/add', async (req, res) => {
  try {
    const { pumpNumber, fuelType } = req.body;
    const result = await pool.query(
      'INSERT INTO station_pumps (pump_number, fuel_type, status) VALUES ($1, $2, $3) RETURNING id AS "_id", pump_number AS "pumpNumber", fuel_type AS "fuelType", status',
      [pumpNumber, fuelType, 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding pump:', error);
    res.status(500).json({ message: 'Error adding pump' });
  }
});

// Get all pumps
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id AS "_id", pump_number AS "pumpNumber", fuel_type AS "fuelType", status FROM station_pumps ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pumps:', error);
    res.status(500).json({ message: 'Error fetching pumps' });
  }
});

// Toggle pump status (Active / Inactive)
router.put('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE station_pumps SET status = $1 WHERE id = $2 RETURNING id AS "_id", pump_number AS "pumpNumber", fuel_type AS "fuelType", status',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pump status:', error);
    res.status(500).json({ message: 'Error updating pump status' });
  }
});

// Delete a pump
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM station_pumps WHERE id = $1', [id]);
    res.json({ message: 'Pump deleted successfully' });
  } catch (error) {
    console.error('Error deleting pump:', error);
    res.status(500).json({ message: 'Error deleting pump' });
  }
});

module.exports = router;