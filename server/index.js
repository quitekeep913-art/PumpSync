const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;
const pool = require('./db/db');

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
    res.send('PumpSync Backend is running!');
});

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/pumps', require('./routes/pump'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});