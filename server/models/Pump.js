const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
  pumpNumber: {
    type: String,
    required: true,
    trim: true
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel'] // Pump mein ya Petrol hoga ya Diesel
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Out of Order', 'Maintenance']
  }
}, { timestamps: true });

module.exports = mongoose.model('Pump', pumpSchema);