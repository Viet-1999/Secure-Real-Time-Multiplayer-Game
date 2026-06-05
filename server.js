require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const Player = require("./public/Player.mjs").default;
const Collectible = require("./public/Collectible.mjs").default;

const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const players = [];
const collectibles = [];
const speed = 10;
const canvasWidth = 640;
const canvasHeight = 480;
const avatarSize = 10;

// FCC tests 16-19: security headers via Helmet v3
app.use(
  helmet({
    noCache: true,
    xssFilter: true,
    hidePoweredBy: false,
  })
);
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

function spawnCollectible() {
  const collectible = new Collectible({
    x: Math.floor(Math.random() * (canvasWidth - avatarSize)),
    y: Math.floor(Math.random() * (canvasHeight - avatarSize)),
    value: 1,
    id: Date.now() + Math.random(),
  });
  collectibles.push(collectible);
  io.emit("newCollectible", collectible);
}

function clampPosition(player) {
  player.x = Math.max(0, Math.min(player.x, canvasWidth - avatarSize));
  player.y = Math.max(0, Math.min(player.y, canvasHeight - avatarSize));
}

app.route("/").get(function (req, res) {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

fccTestingRoutes(app);

app.use(function (req, res) {
  res.status(404).type("text").send("Not Found");
});

io.on("connection", (socket) => {
  socket.on("newPlayer", (player) => {
    const newPlayer = new Player(player);
    players.push(newPlayer);
    if (collectibles.length === 0) {
      spawnCollectible();
    }
    socket.broadcast.emit("newPlayer", newPlayer);
    socket.emit("gameState", { players, collectibles });
  });

  socket.on("movePlayer", (direction) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player) return;

    player.movePlayer(direction, speed);
    clampPosition(player);

    for (let i = collectibles.length - 1; i >= 0; i -= 1) {
      const collectible = collectibles[i];
      if (player.collision(collectible, avatarSize)) {
        player.calculateScore(collectible.value);
        collectibles.splice(i, 1);
        io.emit("collectibleCollected", collectible.id);
        spawnCollectible();
      }
    }

    io.emit("playerMoved", player);
  });

  socket.on("disconnect", () => {
    const index = players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      const [removedPlayer] = players.splice(index, 1);
      io.emit("playerDisconnected", removedPlayer.id);
    }
  });
});

const portNum = process.env.PORT || 3000;

server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log("Tests are not valid:");
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app;
