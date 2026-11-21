const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create the fuel_inventory table automatically if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS fuel_inventory (
    id SERIAL PRIMARY KEY,
    fuel_type VARCHAR(50) NOT NULL UNIQUE,
    capacity_liters NUMERIC(10, 2) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL,
    price_per_liter NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating fuel_inventory table:', err));

// Get all fuel tanks
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, fuel_type AS "fuelType", capacity_liters AS "capacity", current_stock AS "currentStock", price_per_liter AS "pricePerLiter", updated_at AS "updatedAt" FROM fuel_inventory ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// Add a new fuel tank
router.post('/add', async (req, res) => {
  try {
    const { fuelType, capacity, currentStock, pricePerLiter } = req.body;
    const result = await pool.query(
      'INSERT INTO fuel_inventory (fuel_type, capacity_liters, current_stock, price_per_liter) VALUES ($1, $2, $3, $4) RETURNING id, fuel_type AS "fuelType", capacity_liters AS "capacity", current_stock AS "currentStock", price_per_liter AS "pricePerLiter"',
      [fuelType, capacity, currentStock, pricePerLiter]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding fuel tank:', error);
    res.status(500).json({ message: 'Error adding fuel tank (Fuel type might already exist)' });
  }
});

// Update stock (refill) or price
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStock, pricePerLiter } = req.body;
    const result = await pool.query(
      'UPDATE fuel_inventory SET current_stock = $1, price_per_liter = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, fuel_type AS "fuelType", capacity_liters AS "capacity", current_stock AS "currentStock", price_per_liter AS "pricePerLiter"',
      [currentStock, pricePerLiter, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating fuel tank:', error);
    res.status(500).json({ message: 'Error updating fuel tank' });
  }
});

// Delete a fuel tank
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fuel_inventory WHERE id = $1', [id]);
    res.json({ message: 'Fuel tank deleted successfully' });
  } catch (error) {
    console.error('Error deleting fuel tank:', error);
    res.status(500).json({ message: 'Error deleting fuel tank' });
  }
});

module.exports = router;