// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sharedSession = require('express-socket.io-session');
const Message = require('./models/message'); // Message model
const User = require('./models/user'); // User model
const Group = require('./models/group'); // Group model for group chat

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load environment variables
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Session configuration
const sessionMiddleware = session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
});

// Apply the session middleware to the Express app
app.use(sessionMiddleware);

// Share the session with Socket.io
io.use(sharedSession(sessionMiddleware, {
    autoSave: true,
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Routes
const chatRouter = require('./routes/chat');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const groupRouter = require('./routes/group');

app.use('/chat', chatRouter);
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/group', groupRouter);

//info routes
app.get('/',(req,res)=>{
    res.render('index')
})




// Real-time chat with Socket.io
let users = new Map(); // To track connected users

io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining the chat with user _id from the session
    const userId = socket.handshake.session.user.id; // Assume userId is saved in the session

    if (userId) {
        // Fetch user info from the database
        const user = await User.findById(userId);

        if (user) {
            const username = user.username; // Get the username from the user object
            users.set(username, socket.id);
            socket.username = username; // Store the username in socket for reference
            console.log(`User ${username} has joined`);

            // Update and broadcast the list of online users
            io.emit('updateUserList', Array.from(users.keys()));

            // Notify all clients that a new user has joined
            io.emit('userJoined', { username });
        }
    }

    // Handle user list request
    socket.on('requestUserList', () => {
        socket.emit('updateUserList', Array.from(users.keys()).filter(user => user !== socket.username));
    });

    // Handle sending one-to-one messages
    socket.on('sendMessage', async ({ sender, recipient, content }) => {
        const message = new Message({
            sender,
            recipient,
            content,
            chatType: 'one-to-one',
        });

        await message.save();
        console.log('Message sent:', message); // Log sent message

        console.log(users)
        console.log(recipient);
        recipient = await User.findById(recipient);
        recipient = recipient.username;
        console.log(recipient);
        // Send message to the recipient if they are online
        if (users.has(recipient)) {

            io.to(users.get(recipient)).emit('receiveMessage', message);
            console.log('Message delivered to:', recipient); // Log delivery
        }
    });

    // Handle sending group messages
    socket.on('sendGroupMessage', async ({ sender, groupId, content }) => {
        const message = new Message({
            sender,
            groupId,
            content,
            chatType: 'group',
        });

        await message.save();
        console.log('Group message sent:', message); // Log sent group message

        // Broadcast the message to all clients in the group
        const groupMembers = await getGroupMembers(groupId); // Fetch group members asynchronously
        groupMembers.forEach(member => {
            if (users.has(member.username)) { // Ensure you're checking against the username
                io.to(users.get(member.username)).emit('receiveMessage', message);
            }
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.username);
        users.delete(socket.username);

        // Update and broadcast the list of online users
        io.emit('updateUserList', Array.from(users.keys()));
    });
});

// Function to get group members
async function getGroupMembers(groupId) {
    const group = await Group.findById(groupId).populate('members'); // Assuming 'members' is an array of User IDs
    return group.members; // This should return the populated user objects
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
