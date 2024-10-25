// In routes/chat.js
const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const Group = require('../models/group');
const User = require('../models/user');


router.get('/',async(req,res)=>{
    res.render('chat',{
        user:req.session.user
    })
})
// Route to display individual user chat
router.get('/user/:recipientId', async (req, res) => {
    const recipientId = req.params.recipientId;

    try {
        const recipientUser = await User.findOne({ username: recipientId }); // Use findOne to get a single user
        if (!recipientUser) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }
        
        // Render the userChat view with the recipient's information
        res.render('userChat', { 
            user: req.session.user, 
            recipientId: recipientUser._id,  // Access _id directly
            recipientUsername: recipientUser.username 
        });
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send('Internal Server Error'); // Handle any other errors
    }
});


// Route to display group chat
router.get('/group/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId);
    res.render('groupChat', { 
        user: req.session.user, 
        groupId, 
        groupName: group.name 
    });
});

// Fetch one-to-one messages
router.get('/messages/one-to-one/:recipientId', async (req, res) => {
    const { recipientId } = req.params;
    const userId = req.session.user.id;
    const messages = await Message.find({
        $or: [
            { sender: userId, recipient: recipientId },
            { sender: recipientId, recipient: userId }
        ]
    }).sort({ createdAt: 1 });
    res.json(messages);
});

// Fetch group messages
router.get('/messages/group/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    res.json(messages);
});

module.exports = router;
