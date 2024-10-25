const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for group messages
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // used for group chats
    content: { type: String, required: true },
    chatType: { type: String, enum: ['one-to-one', 'group'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
