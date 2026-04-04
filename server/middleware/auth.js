const jwt = require('jsonwebtoken');
// IMPORTANT: Matches your filename 'models/Schemas.js' exactly
const { User } = require('../models/Schemas'); 

module.exports = async function(req, res, next) {
    // 1. Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // 2. Check if no token exists
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 3. Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. THE CRITICAL FIX: 
        // We fetch the full user from the database using the ID stored in the token.
        // This ensures req.user has the 'email' field needed for your booking alerts.
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists in the database' });
        }

        // 5. Attach the real database user object to the request
        req.user = user; 
        next();
    } catch (err) {
        console.error("Middleware Auth Error:", err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};