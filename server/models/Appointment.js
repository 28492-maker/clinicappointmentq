const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // FIX: Changed 'patient' to 'patientId' to match your Database
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // FIX: Changed 'doctor' to 'doctorId' to match your Database
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true 
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    queueNumber: { type: Number, default: null }
}, { timestamps: true }); // Adding timestamps helps with sorting the queue!

module.exports = mongoose.model('Appointment', appointmentSchema);