const express = require('express');
const router = express.Router();
// We only need Appointment and User if doctors are stored in User collection
const { Appointment, User } = require('../models/schema'); 
const auth = require('../middleware/auth');
const { sendBookingEmail } = require('../utils/emailService');

// --- NEW: GET DOCTORS FOR DROPDOWN ---
// Use this URL in your frontend: http://localhost:5000/api/appointments/doctors
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('name specialization status _id');
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching doctors' });
    }
});

// Book Appointment
router.post('/', auth, async (req, res) => {
    const { doctorId, date, time } = req.body;
    try {
        const existing = await Appointment.findOne({ doctorId, date, time, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'Slot already booked' });

        const appointment = new Appointment({
            patientId: req.user.id, 
            doctorId: doctorId,
            date,
            time
        });

        await appointment.save();
        
        // FIX: Look for the doctor in the User collection
        const doc = await User.findById(doctorId); 
        const user = await User.findById(req.user.id);

        console.log("--- DEBUG ---");
        console.log("Doctor Found:", doc ? doc.name : "NOT FOUND");
        console.log("Patient Email:", user ? user.email : "NOT FOUND");

        // 4. Send Email
        if (user && user.email && doc) {
            await sendBookingEmail(user.email, doc.name, date, time);
        } else {
            console.log("NOTIFICATION: Email skipped. Missing user email or doctor info.");
        }

        res.json(appointment);
    } catch (err) {
        console.error("Booking Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Appointments
router.get('/my', auth, async (req, res) => {
    try {
        // Populating 'doctorId' from the 'User' model
        const appointments = await Appointment.find({ patientId: req.user.id }).populate('doctorId', 'name specialization');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;