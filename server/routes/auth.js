const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Route for User Registration
router.post('/register', register);

// Route for User Login
router.post('/login', login);
const verifyToken = require('../middleware/authMiddleware');

// Protected Route Example (Only accessible with a valid token)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // req.user contains the decoded token data (id and role)
        res.json({ 
            message: "Welcome to your secure profile!", 
            userData: req.user 
        });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});
module.exports = router;