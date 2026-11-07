const express = require('express');
const router = express.Router();
const Pump = require('../models/Pump'); // Jo model humne abhi banaya hai

// 1. Naya Pump Add karne ki API (POST Request)
router.post('/add', async (req, res) => {
  try {
    const { pumpNumber, fuelType, status } = req.body;
    
    const newPump = new Pump({
      pumpNumber,
      fuelType,
      status: status || 'Active'
    });

    const savedPump = await newPump.save();
    res.status(201).json({ message: 'Pump added successfully!', pump: savedPump });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error, could not add pump' });
  }
});

// 2. Saare Pumps dekhne ki API (GET Request)
router.get('/all', async (req, res) => {
  try {
    const pumps = await Pump.find().sort({ createdAt: -1 }); // Naye pumps pehle aayenge
    res.status(200).json(pumps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error, could not fetch pumps' });
  }
});

module.exports = router;