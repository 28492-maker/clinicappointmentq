const mongoose = require('mongoose');

// 1. USER SCHEMA
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'admin', 'doctor'], default: 'patient' }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Required for auth.js to send the email correctly
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role
    };
};

// 2. DOCTOR SCHEMA 
// UPDATED: Matches your MongoDB Compass screenshot exactly
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    email: { type: String }, // Added because it's in your DB
    role: { type: String },  // Added because it's in your DB
    status: { type: String, default: 'available' } // Changed from 'availability' to 'status'
}, { 
    collection: 'doctors', // 👈 Forces Mongoose to use the "doctors" collection
    timestamps: true 
});

// 3. APPOINTMENT SCHEMA
const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Points to Doctor model
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'serving', 'completed', 'cancelled'], default: 'pending' },
    queueNumber: { type: Number }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = { User, Doctor, Appointment };