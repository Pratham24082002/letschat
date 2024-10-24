const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Registration route
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User({ username, password });
        await user.save();
        req.session.user = { username: user.username };
        res.redirect('/auth/chat');
    } catch (error) {
        res.status(400).send('User registration failed. Try a different username.');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await user.comparePassword(password)) {
            req.session.user = { username: user.username };
            res.redirect('/auth/chat');
        } else {
            res.status(400).send('Invalid username or password.');
        }
    } catch (error) {
        res.status(400).send('Login failed.');
    }
});

// Protect the chat route
router.get('/chat', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('chat', { user: req.session.user });
  });

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
