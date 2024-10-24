const express = require('express');
const router = express.Router();
const Message = require('../models/message');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/chat', async (req, res) => {
    const messages = await Message.find({});
    res.render('chat', { messages });
});

module.exports = router;
