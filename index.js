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

io.on("connection", (socket) => {
    
    console.log(`User Connected: ${socket.id}`);

    socket.on("create", (data) => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const name = data.name;
        sessions[code] = { players: [name], socketIds: [socket.id]};
        console.log(`${name} Joining with Code ${code}`);
        socket.emit("room-created", code);
    });

    socket.on("join", (data) => {
        const code = data.code;
        const name = data.name;
        console.log(`Joining with code ${code} and name ${name}`);
        if (sessions[code]) {
            sessions[code].players.push(name);
            sessions[code].socketIds.push(socket.id);
            console.log(`Joined a game with ${sessions[code].players}\n`);
            console.log(sessions);
            socket.emit("join-success", {players: sessions[code].players});
            for (let sockId of sessions[code].socketIds) {
                io.to(sockId).emit("join-success", {players: sessions[code].players});
            }
        } else {
            console.log("Failure\n");
            socket.emit("join-failure", {});
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