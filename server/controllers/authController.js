const pool = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // Insert new user into the database
        const newUser = await pool.query(
            "INSERT INTO Users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name, email, bcryptPassword, role]
        );

        res.json({ message: "User successfully registered!", user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// Login an existing user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Verify the password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role }, 
            process.env.JWT_SECRET || "supersecretkey", 
            { expiresIn: "10h" }
        );

        res.json({ message: "Login successful!", token, role: user.rows[0].role });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { register, login };