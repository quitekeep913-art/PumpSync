const pool = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ALLOWED_PUBLIC_ROLES = ['Owner', 'Fleet Manager', 'fleet_manager', 'owner'];

// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "Name, email, password, and role are required" });
        }

        if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
            return res.status(403).json({ error: "Only Owner or Fleet Manager can self-register" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM Users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "Email is already registered" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // Insert new user into the database
        const newUser = await pool.query(
            "INSERT INTO Users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name.trim(), normalizedEmail, bcryptPassword, role]
        );

        res.status(201).json({ message: "User successfully registered!", user: newUser.rows[0] });
    } catch (err) {
        console.error("Register error:", err.message);

        if (err.code === '23505') {
            return res.status(409).json({ error: "Email is already registered" });
        }
        if (err.code === '23514') {
            return res.status(400).json({
                error: "Database role constraint rejected this role value. Check Users.role allowed values."
            });
        }

        res.status(500).json({ error: "Server Error" });
    }
};

// Login an existing user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = (email || '').trim().toLowerCase();

        // Check if user exists
        const user = await pool.query("SELECT * FROM Users WHERE LOWER(email) = $1", [normalizedEmail]);
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
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { register, login };