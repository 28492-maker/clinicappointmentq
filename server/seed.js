const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Import the actual Doctor model from your Schemas file
const { Doctor } = require('./models/Schemas'); 

dotenv.config();

const seedDoctors = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!");

        // 1. Clear the collection
        await Doctor.deleteMany({});
        console.log("🗑️ Old doctors cleared.");

        // 2. Insert fresh data that matches your UI expectations
        const doctorData = [
            { name: "Dr. Smith", specialization: "Cardiology", status: "available" },
            { name: "Dr. Adams", specialization: "Pediatrics", status: "available" },
            { name: "Dr. Brown", specialization: "Dermatology", status: "available" },
            { name: "Dr. Wilson", specialization: "Neurology", status: "available" },
            { name: "Dr. Taylor", specialization: "General Medicine", status: "available" }
        ];

        await Doctor.insertMany(doctorData);
        console.log("✅ Doctors Seeded Successfully!");
        
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
};

seedDoctors();