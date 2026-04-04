const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Keeps password hidden from queries by default
    },
    role: {
        type: String,
        enum: ['patient', 'admin'],
        default: 'patient',
        required: true
    }
}, {
    timestamps: true,
    // This ensures that when we send 'user' to the frontend, 
    // all fields (including the email) are included.
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password; // Extra safety
            return ret;
        }
    }
});

/**
 * Force-builds a profile object to send to the Frontend.
 * Use this in your Login/Register routes!
 */
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email, // 👈 This explicitly grabs the email from DB
        role: this.role
    };
};

const User = mongoose.model('User', userSchema);
module.exports = User;