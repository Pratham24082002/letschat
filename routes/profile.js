// profile.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

// Render profile page
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('profile', { user: req.session.user });
});

// Handle profile updates
router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    const { password } = req.body;

    try {
        // Update the user's password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(req.session.user.id, { password: hashedPassword });
            console.log('Password updated successfully');
        }

        res.redirect('/chat');
    } catch (err) {
        console.error('Profile Update Error:', err);
        res.render('profile', { user: req.session.user, error: 'Failed to update profile' });
    }
});

module.exports = router;
