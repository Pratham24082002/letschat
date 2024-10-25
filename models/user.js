const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: '' }, // URL to the profile picture
    status: { type: String, default: 'Hey there! I am using Chat App.' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
