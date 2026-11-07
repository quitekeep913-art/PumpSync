const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Naya Mongoose Import

const app = express();
const PORT = 5000;
const pool = require('./db/db'); 

// 🚀 Mongoose ko Database se connect karne ka code
const dbURI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pumpsync';
mongoose.connect(dbURI)
  .then(() => console.log('Mongoose is also Connected Successfully! 🚀'))
  .catch((err) => console.log('Mongoose Connection Error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Basic Test Route
app.get('/', (req, res) => {
    res.send('PumpSync Backend is running!');
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/pumps', require('./routes/pump'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});