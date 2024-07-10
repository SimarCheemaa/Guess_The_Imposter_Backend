const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
let sessions = {};

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const allReady = (code) => {
    for (let struct of sessions[code].players) {
        if (struct.readyStatus == false) {
            console.log(`${struct.name} Is not ready`);
            return false;
        };
    };
    console.log("All Ready")
    return true;
}

io.on("connection", (socket) => {
    
    console.log(`User Connected: ${socket.id}`);

    socket.on("create", (data) => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const name = data.name;
        // sessions[code] = { players: [name], socketIds: [socket.id]};
        sessions[code] = { players: [{ name: name, readyStatus: false, socketId: socket.id}] };
        console.log(`${name} Joining with Code ${code}`);
        socket.emit("room-created", code);
        socket.emit("player-status", {players: sessions[code].players});
    });

    socket.on("join", (data) => {
        const code = data.code;
        const name = data.name;
        console.log(`Joining with code ${code} and name ${name}`);
        if (sessions[code]) {
            sessions[code].players.push({ name: name, readyStatus: false, socketId: socket.id});
            // sessions[code].socketIds.push(socket.id);
            console.log(`Joined a game with ${sessions[code].players}\n`);
            console.log(sessions);
            // socket.emit("join-success", {players: sessions[code].players});
            for (let struct of sessions[code].players) {
                io.to(struct.socketId).emit("join-success", {players: sessions[code].players});
            }
        } else {
            console.log("Failure\n");
            socket.emit("join-failure", {});
        }
    })

    socket.on("ready-up", (data) => {
        const ready = data.ready;
        const code = data.code;
        for (let struct of sessions[code].players) {
            if (struct.socketId == socket.id) {
                struct.readyStatus = ready;
            };
        }
        if (allReady(code)) {
            console.log("Sending all ready");
            for (let struct of sessions[code].players) {
                io.to(struct.socketId).emit("all-ready", "Hello World");
                io.to(struct.socketId).emit("player-status", {players: sessions[code].players});
            }
        }
        else {
            for (let struct of sessions[code].players) {
                io.to(struct.socketId).emit("player-status", {players: sessions[code].players});
            }
        }
    })

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    })
})

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});