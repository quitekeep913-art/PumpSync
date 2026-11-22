const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Create the daily_sales table automatically if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS daily_sales (
    id SERIAL PRIMARY KEY,
    pump_number VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    liters_sold NUMERIC(10, 2) NOT NULL,
    price_per_liter NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating daily_sales table:', err));

// Get all sales records
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, pump_number AS "pumpNumber", fuel_type AS "fuelType", liters_sold AS "litersSold", price_per_liter AS "pricePerLiter", total_amount AS "totalAmount", sale_date AS "saleDate" FROM daily_sales ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Add a new sale and deduct stock from fuel_inventory
router.post('/add', async (req, res) => {
  try {
    const { pumpNumber, fuelType, litersSold, pricePerLiter } = req.body;
    const totalAmount = Number(litersSold) * Number(pricePerLiter);

    // Insert the sale record
    const result = await pool.query(
      'INSERT INTO daily_sales (pump_number, fuel_type, liters_sold, price_per_liter, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING id, pump_number AS "pumpNumber", fuel_type AS "fuelType", liters_sold AS "litersSold", price_per_liter AS "pricePerLiter", total_amount AS "totalAmount", sale_date AS "saleDate"',
      [pumpNumber, fuelType, litersSold, pricePerLiter, totalAmount]
    );

    // Automatically deduct sold liters from fuel_inventory
    await pool.query(
      'UPDATE fuel_inventory SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP WHERE fuel_type = $2',
      [litersSold, fuelType]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding sale:', error);
    res.status(500).json({ message: 'Error adding sale' });
  }
});

// Delete a sale record
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM daily_sales WHERE id = $1', [id]);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sale' });
  }
});

module.exports = router;