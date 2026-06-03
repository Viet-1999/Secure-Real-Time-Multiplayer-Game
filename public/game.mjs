import Player from "./Player.mjs";

const socket = io();
const canvas = document.getElementById("game-window");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const rankEl = document.getElementById("rank");
const players = [];
const collectibles = [];
const keysHeld = new Set();
const avatarSize = 10;

function drawPlayers() {
  players.forEach((player) => {
    context.fillStyle = "red";
    context.fillRect(player.x, player.y, avatarSize, avatarSize);
  });
}

function drawCollectibles() {
  collectibles.forEach((collectible) => {
    context.fillStyle = "blue";
    context.fillRect(collectible.x, collectible.y, avatarSize, avatarSize);
  });
}

function drawGame() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayers();
  drawCollectibles();
}

function updateScoreAndRank() {
  const me = players.find((p) => p.id === socket.id);
  if (!me) return;
  scoreEl.textContent = `Score: ${me.score}`;
  rankEl.textContent = new Player(me).calculateRank(players);
}

function updateGame() {
  drawGame();
}

function startGame() {
  setInterval(updateGame, 1000 / 60);
}

function getDirectionFromKey(key) {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

function emitMove(direction) {
  socket.emit("movePlayer", direction);
}

document.addEventListener("keydown", (event) => {
  const direction = getDirectionFromKey(event.key);
  if (!direction || keysHeld.has(direction)) return;
  event.preventDefault();
  keysHeld.add(direction);
  emitMove(direction);
});

document.addEventListener("keyup", (event) => {
  const direction = getDirectionFromKey(event.key);
  if (direction) keysHeld.delete(direction);
});

setInterval(() => {
  keysHeld.forEach((direction) => emitMove(direction));
}, 80);

socket.on("connect", () => {
  const player = new Player({
    x: Math.floor(Math.random() * (canvas.width - avatarSize)),
    y: Math.floor(Math.random() * (canvas.height - avatarSize)),
    score: 0,
    id: socket.id,
  });

  players.push(player);
  socket.emit("newPlayer", player);
  updateScoreAndRank();
});

socket.on("newPlayer", (player) => {
  if (!players.some((p) => p.id === player.id)) {
    players.push(player);
    updateScoreAndRank();
  }
});

socket.on("newCollectible", (collectible) => {
  if (!collectibles.some((c) => c.id === collectible.id)) {
    collectibles.push(collectible);
  }
});

socket.on("playerMoved", (player) => {
  const index = players.findIndex((p) => p.id === player.id);
  if (index !== -1) {
    players[index].x = player.x;
    players[index].y = player.y;
    players[index].score = player.score;
  } else {
    players.push(new Player(player));
  }
  updateScoreAndRank();
});

socket.on("collectibleCollected", (collectibleId) => {
  const index = collectibles.findIndex((c) => c.id === collectibleId);
  if (index !== -1) {
    collectibles.splice(index, 1);
  }
});

socket.on("gameState", (state) => {
  players.length = 0;
  collectibles.length = 0;
  state.players.forEach((player) => players.push(player));
  state.collectibles.forEach((collectible) => collectibles.push(collectible));
  updateScoreAndRank();
});

socket.on("playerDisconnected", (playerId) => {
  const index = players.findIndex((p) => p.id === playerId);
  if (index !== -1) {
    players.splice(index, 1);
  }
  updateScoreAndRank();
});

startGame();
