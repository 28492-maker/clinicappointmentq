const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. REGISTER: Now includes 'email' in the final response
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'patient' 
        });
        
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // FIX: Added 'email' to the response so the frontend can save it
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. LOGIN: Crucial fix to send the email to the frontend
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // FIX: Added 'email' here. Without this, your booking email will be 'undefined'
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. GET DOCTORS: Added this so the "Select Doctor" dropdown works
// This route will look for anyone in the User collection with the role 'doctor'
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('name _id');
        
        if (!doctors || doctors.length === 0) {
            console.log("⚠️ No users found with role 'doctor' in the database.");
        }
        
        res.json(doctors);
    } catch (err) {
        console.error("Fetch Doctors Error:", err.message);
        res.status(500).json({ message: 'Error fetching doctors' });
    }
});

module.exports = router;