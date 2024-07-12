const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');

let sessions = {};
const gameData = {
    "Athletes": {
        "LeBron James": "lebron_james_image",
        "Serena Williams": "serena_williams_image",
        "Lionel Messi": "lionel_messi_image",
        "Tom Brady": "tom_brady_image",
        "Usain Bolt": "usain_bolt_image"
    },
    "Movies": {
        "The Godfather": "path/to/the_godfather_image",
        "Titanic": "path/to/titanic_image",
        "Inception": "path/to/inception_image",
        "Jurassic Park": "path/to/jurassic_park_image",
        "Star Wars": "path/to/star_wars_image"
    },
    "Animals": {
        "Elephant": "path/to/elephant_image",
        "Penguin": "path/to/penguin_image",
        "Kangaroo": "path/to/kangaroo_image",
        "Dolphin": "path/to/dolphin_image",
        "Peacock": "path/to/peacock_image"
    },
    "Famous Landmarks": {
        "Eiffel Tower": "path/to/eiffel_tower_image",
        "Great Wall of China": "path/to/great_wall_of_china_image",
        "Statue of Liberty": "path/to/statue_of_liberty_image",
        "Colosseum": "path/to/colosseum_image",
        "Machu Picchu": "path/to/machu_picchu_image"
    },
    "Fruits": {
        "Apple": "path/to/apple_image",
        "Banana": "path/to/banana_image",
        "Mango": "path/to/mango_image",
        "Pineapple": "path/to/pineapple_image",
        "Strawberry": "path/to/strawberry_image"
    },
    "Books": {
        "Harry Potter": "path/to/harry_potter_image",
        "The Great Gatsby": "path/to/the_great_gatsby_image",
        "Moby Dick": "path/to/moby_dick_image",
        "To Kill a Mockingbird": "path/to/to_kill_a_mockingbird_image",
        "The Hobbit": "path/to/the_hobbit_image"
    },
    "TV Shows": {
        "Friends": "path/to/friends_image",
        "Breaking Bad": "path/to/breaking_bad_image",
        "Game of Thrones": "path/to/game_of_thrones_image",
        "The Office": "path/to/the_office_image",
        "Stranger Things": "path/to/stranger_things_image"
    },
    "Superheroes": {
        "Spider-Man": "path/to/spider_man_image",
        "Batman": "path/to/batman_image",
        "Wonder Woman": "path/to/wonder_woman_image",
        "Iron Man": "path/to/iron_man_image",
        "Superman": "path/to/superman_image"
    },
    "Countries": {
        "Brazil": "path/to/brazil_image",
        "Japan": "path/to/japan_image",
        "Canada": "path/to/canada_image",
        "Australia": "path/to/australia_image",
        "Italy": "path/to/italy_image"
    },
    "Cartoon Characters": {
        "Mickey Mouse": "path/to/mickey_mouse_image",
        "SpongeBob SquarePants": "path/to/spongebob_squarepants_image",
        "Bugs Bunny": "path/to/bugs_bunny_image",
        "Scooby-Doo": "path/to/scooby_doo_image",
        "Homer Simpson": "path/to/homer_simpson_image"
    },
    "Musical Instruments": {
        "Guitar": "path/to/guitar_image",
        "Piano": "path/to/piano_image",
        "Violin": "path/to/violin_image",
        "Drums": "path/to/drums_image",
        "Saxophone": "path/to/saxophone_image"
    },
    "Sports": {
        "Soccer": "path/to/soccer_image",
        "Basketball": "path/to/basketball_image",
        "Tennis": "path/to/tennis_image",
        "Cricket": "path/to/cricket_image",
        "Baseball": "path/to/baseball_image"
    },
    "Celebrities": {
        "Beyoncé": "path/to/beyonce_image",
        "Brad Pitt": "path/to/brad_pitt_image",
        "Taylor Swift": "path/to/taylor_swift_image",
        "Dwayne Johnson": "path/to/dwayne_johnson_image",
        "Jennifer Lawrence": "path/to/jennifer_lawrence_image"
    },
    "Cities": {
        "New York": "path/to/new_york_image",
        "Paris": "path/to/paris_image",
        "Tokyo": "path/to/tokyo_image",
        "Sydney": "path/to/sydney_image",
        "Rio de Janeiro": "path/to/rio_de_janeiro_image"
    },
    "Historical Figures": {
        "Abraham Lincoln": "path/to/abraham_lincoln_image",
        "Cleopatra": "path/to/cleopatra_image",
        "Albert Einstein": "path/to/albert_einstein_image",
        "Napoleon Bonaparte": "path/to/napoleon_bonaparte_image",
        "Marie Curie": "path/to/marie_curie_image"
    }
};
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
    for (let struct of sessions[code]) {
        if (struct.readyStatus == false) {
            console.log(`${struct.name} Is not ready`);
            return false;
        };
    };
    console.log("All Ready")
    return true;
}

const random = () => {
    const categories = Object.keys(gameData);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const words = Object.keys(gameData[randomCategory]);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const imagePath = gameData[randomCategory][randomWord];
    return {category: randomCategory, word: randomWord, imagePath: imagePath};
}

io.on("connection", (socket) => {
    
    console.log(`User Connected: ${socket.id}`);

    socket.on("create", (data) => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const name = data.name;
        // sessions[code] = { players: [name], socketIds: [socket.id]};
        sessions[code] = [{ name: name, readyStatus: false, socketId: socket.id}];
        // console.log(`${name} Joining with Code ${code}`);
        socket.emit("room-created", code);
        socket.emit("player-status", {players: sessions[code]});
    });

    socket.on("join", (data) => {
        const code = data.code;
        const name = data.name;
        // console.log(`Joining with code ${code} and name ${name}`);
        if (sessions[code]) {
            sessions[code].push({ name: name, readyStatus: false, socketId: socket.id});
            // sessions[code].socketIds.push(socket.id);
            // console.log(`Joined a game with ${sessions[code].players}\n`);
            console.log(sessions);
            // socket.emit("join-success", {players: sessions[code].players});
            for (let struct of sessions[code]) {
                io.to(struct.socketId).emit("join-success", {players: sessions[code]});
            }
        } else {
            console.log("Failure\n");
            socket.emit("join-failure", {});
        }
    })

    socket.on("ready-up", (data) => {
        const ready = data.ready;
        const code = data.code;
        console.log(`This is the code: ${code}`)
        if (sessions[code]) {
            for (let struct of sessions[code]) {
                if (struct.socketId == socket.id) {
                    struct.readyStatus = ready;
                };
            }
        }

        if (allReady(code) && sessions[code].length >= 3) {
            console.log("Sending all ready");
            //Make every person's ready status false in sessions[code]
            for (let struct of sessions[code]) {
                struct.readyStatus = false;
            }
            const obj = random();
            const category = obj.category;
            const word = obj.word;
            const imagePath = obj.imagePath;
            // Get a random index between 0 and players.length - 1
            const randomIndex = Math.floor(Math.random() * sessions[code].length);
            // Get the random player
            let randomPlayerSocket = sessions[code][randomIndex].socketId;

            for (let struct of sessions[code]) {
                //This player is the imposter
                if (struct.socketId == randomPlayerSocket) {
                    io.to(struct.socketId).emit("all-ready", {category: category, word: "You are the Imposter", imagePath: "imposter_path.jpg"});
                }
                else {
                    io.to(struct.socketId).emit("all-ready", obj);
                }
                io.to(struct.socketId).emit("player-status", {players: sessions[code]});
            }
        }
        else {
            console.log(sessions);
            for (let struct of sessions[code]) {
                io.to(struct.socketId).emit("player-status", {players: sessions[code]});
            }
        }
        console.log(sessions[code]);
    })

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
        for (let code in sessions) {
            if (sessions[code] && sessions[code]) {
                for (let i = 0; i < sessions[code].length; i++) {
                    //Purge code if players is empty
                    if (sessions[code][i].socketId == socket.id) {
                        sessions[code].splice(i, 1);
                        break; // Exit the loop once the player is found and removed
                    }
                }
            }
        }
        console.log(sessions);
    })
})

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});