const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    enrollmentNumber: { type: String },
    department: { type: String },
    semester: { type: Number },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;