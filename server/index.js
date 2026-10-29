const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;
const pool = require('./db/db');

// Middleware
app.use(cors());
app.use(express.json());


// Basic Test Route
app.get('/', (req, res) => {
    res.send('PumpSync Backend is running!');
});
// Routes
app.use('/auth', require('./routes/auth'));
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});