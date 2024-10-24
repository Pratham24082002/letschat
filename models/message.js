const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: String,
    recipient: String, // If it's a group chat, set as "group"
    content: String,
    timestamp: { type: Date, default: Date.now },
    chatType: { type: String, enum: ['one-to-one', 'group'], default: 'one-to-one' }
});

module.exports = mongoose.model('Message', MessageSchema);
