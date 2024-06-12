const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const bodyParser = require('body-parser');
const { register, login, verifyToken } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/register', (req, res) => {
    try {
        const token = register(req.body.username, req.body.password);
        res.json({ token });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/login', (req, res) => {
    try {
        const token = login(req.body.username, req.body.password);
        res.json({ token });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

io.use((socket, next) => {
    const token = socket.handshake.query.token;
    try {
        const decoded = verifyToken(token);
        socket.username = decoded.username;
        next();
    } catch (e) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`${socket.username} connected`);

    socket.on('privateMessage', ({ recipient, message }) => {
        const recipientSocket = [...io.sockets.sockets.values()].find(s => s.username === recipient);
        if (recipientSocket) {
            recipientSocket.emit('privateMessage', { sender: socket.username, message });
        }
    });

    socket.on('publicMessage', (message) => {
        io.emit('publicMessage', { sender: socket.username, message });
    });

    socket.on('disconnect', () => {
        console.log(`${socket.username} disconnected`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
