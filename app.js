const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Session configuration
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL}),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
app.use('/', indexRouter);
app.use('/auth', authRouter);

// Real-time chat with Socket.io
let users = {}; // To track connected users

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining the chat with username from the session
    if (socket.request.session && socket.request.session.user) {
        const username = socket.request.session.user.username;
        users[username] = socket.id;
        socket.username = username;
        console.log(`User ${username} has joined`);

        // Update and broadcast the list of online users
        io.emit('updateUserList', Object.keys(users));
    }

    // Handle sending one-to-one messages
    socket.on('sendMessage', async ({ sender, recipient, content }) => {
        const message = new Message({ sender, recipient, content, chatType: 'one-to-one' });
        await message.save();

        // Send message to the recipient if they are online
        if (users[recipient]) {
            io.to(users[recipient]).emit('receiveMessage', message);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.username);
        delete users[socket.username];

        // Update and broadcast the list of online users
        io.emit('updateUserList', Object.keys(users));
    });
});




// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
