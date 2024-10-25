// auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Assuming the user model is in the models folder
const router = express.Router();

// Render login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Render registration page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Handle user registration
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { error: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        // Store the user information in the session
        req.session.user = {
            id: newUser._id,
            username: newUser.username
        };

        // Redirect to the chat page
        res.redirect('/chat');
    } catch (err) {
        console.error('Registration Error:', err);
        res.render('register', { error: 'An error occurred during registration' });
    }
});

// Handle user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        // Store the user information in the session
        req.session.user = {
            id: user._id,
            username: user.username
        };

        // Redirect to the chat page
        res.redirect('/chat');
    } catch (err) {
        console.error('Login Error:', err);
        res.render('login', { error: 'An error occurred during login' });
    }
});

// Handle user logout
router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout Error:', err);
            return res.redirect('/chat');
        }

        // Redirect to the login page
        res.redirect('/auth/login');
    });
});

module.exports = router;
