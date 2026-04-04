require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Appointment, Doctor } = require('./models/Schemas'); 
const auth = require('./middleware/auth');

const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 2. MONGODB ATLAS CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ Connection Error:', err));

// 3. EMAIL CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// 4. AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role: 'patient' });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Include name and role in the token for the frontend to use
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({ 
            token, 
            user: { id: user._id, name: user.name, role: user.role, email: user.email } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. DOCTOR ROUTES
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        res.status(200).json(doctors);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// 6. APPOINTMENT & QUEUE ROUTES
app.post('/api/appointments', auth, async (req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime } = req.body; 
        const userId = req.user.id;

        const user = await User.findById(userId);
        const doctor = await Doctor.findById(doctorId); 

        if (!user || !doctor) return res.status(404).json({ message: "User or Doctor not found" });

        // Calculate queue number for that specific doctor on that specific date
        const count = await Appointment.countDocuments({ doctorId, date: appointmentDate });
        const queueNumber = count + 1;

        const appt = new Appointment({
            patientId: userId,
            doctorId,
            date: appointmentDate,
            time: appointmentTime,
            queueNumber,
            status: 'pending'
        });
        await appt.save();

        // Email Confirmation
        if (user.email) {
            const mailOptions = {
                from: `"MediQueue Clinic" <${process.env.EMAIL_USER}>`,
                to: user.email.trim(),
                subject: '🏥 Appointment Confirmed',
                html: `<h3>Booking Confirmed!</h3>
                       <p><strong>Doctor:</strong> ${doctor.name}</p>
                       <p><strong>Date:</strong> ${appointmentDate}</p>
                       <p><strong>Queue Number:</strong> ${queueNumber}</p>`
            };
            transporter.sendMail(mailOptions).catch(e => console.log("Email error:", e.message));
        }

        res.status(201).json({ message: "Booked successfully", queueNumber });
    } catch (err) { 
        res.status(500).json({ message: err.message });
    }
});

// PATIENT VIEW: Get current status
app.get('/api/appointments/my', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 });

        if (appointments.length === 0) {
            return res.json({ current: "No Queue", yourPosition: "None" });
        }

        const latest = appointments[0];
        
        // Find who is currently being served by the SAME doctor
        const currentlyServing = await Appointment.findOne({
            doctorId: latest.doctorId,
            date: latest.date,
            status: 'pending' 
        }).sort({ queueNumber: 1 });

        res.json({
            current: currentlyServing ? currentlyServing.queueNumber : "Done",
            yourPosition: latest.queueNumber
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// DOCTOR VIEW: See their specific queue
app.get('/api/doctor/queue', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied: Doctors only" });
        }
        
        // The doctor ID in the Appointment collection must match the User ID of the logged-in doctor
        const queue = await Appointment.find({ 
            doctorId: req.user.id, 
            status: 'pending' 
        })
        .populate('patientId', 'name email')
        .sort({ queueNumber: 1 });

        res.json(queue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DOCTOR ACTION: Complete an appointment
app.patch('/api/appointments/:id/complete', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'completed' },
            { new: true }
        );
        
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        res.json({ message: "Patient served", appointment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});