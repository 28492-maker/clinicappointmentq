const express = require('express');
const router = express.Router();
const { Appointment } = require('../models/Schemas'); // Point to your Schemas file
const auth = require('../middleware/auth');

// Get Queue Status
router.get('/status', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // FIX: Changed 'patient' to 'patientId' to match your Database screenshot
        const waiting = await Appointment.find({ date: today, status: 'pending' })
            .populate('patientId', 'name') 
            .sort({ createdAt: 1 });

        const current = await Appointment.findOne({ date: today, status: 'confirmed' })
            .populate('patientId', 'name');

        const next = waiting.length > 0 ? waiting[0] : null;

        res.json({
            // Use queueNumber from your DB instead of _id for better display
            current: current ? { queueNumber: current.queueNumber, patientName: current.patientId?.name } : null,
            next: next ? { queueNumber: next.queueNumber, patientName: next.patientId?.name } : null,
            waiting: waiting.map(a => ({ queueNumber: a.queueNumber, patientName: a.patientId?.name }))
        });
    } catch (err) {
        console.error("Queue Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ... (keep /next and /complete as they are)
module.exports = router;