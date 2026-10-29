const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // Get token from the request headers
    const token = req.header("Authorization");

    // Check if token does not exist
    if (!token) {
        return res.status(403).json({ error: "Access denied. No token provided." });
    }

    try {
        // Remove 'Bearer ' prefix if included
        const bearerToken = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;
        
        // Verify the token
        const verified = jwt.verify(bearerToken, process.env.JWT_SECRET || "supersecretkey");
        
        // Attach user info to the request object
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token." });
    }
};

module.exports = verifyToken;