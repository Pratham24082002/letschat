// routes/group.js
const express = require('express');
const Group = require('../models/group');
const User = require('../models/user');
const router = express.Router();

// Render the group creation form
router.get('/create', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('createGroup', { user: req.session.user });
});

// Handle group creation
router.post('/create', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    const { name } = req.body;

    try {
        const newGroup = new Group({ name, members: [req.session.user.id] });
        await newGroup.save();

        res.redirect('/chat');
    } catch (err) {
        console.error('Group Creation Error:', err);
        res.render('createGroup', { user: req.session.user, error: 'Failed to create group' });
    }
});

// Render add user to group form
router.get('/addUser', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    try {
        const groups = await Group.find().populate('members', 'username');
        const users = await User.find().select('username');
        res.render('addUserToGroup', { groups, users, user: req.session.user });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.redirect('/chat');
    }
});

// Handle adding a user to a group
router.post('/addUser', async (req, res) => {
    const { groupId, userId } = req.body;

    try {
        await Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } });
        res.redirect('/chat');
    } catch (err) {
        console.error('Error adding user to group:', err);
        res.redirect('/chat');
    }
});

module.exports = router;
