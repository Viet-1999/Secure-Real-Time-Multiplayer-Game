class Player {
  constructor({ x, y, score, id }) {
    this.x = x;
    this.y = y;
    this.score = score || 0;
    this.id = id;
  }

  movePlayer(direction, pixels) {
    switch (direction) {
      case "up":
        this.y -= pixels;
        break;
      case "down":
        this.y += pixels;
        break;
      case "left":
        this.x -= pixels;
        break;
      case "right":
        this.x += pixels;
        break;
      default:
        break;
    }

    return { x: this.x, y: this.y };
  }

  collision(item, size = 10) {
    return (
      this.x < item.x + size &&
      this.x + size > item.x &&
      this.y < item.y + size &&
      this.y + size > item.y
    );
  }

  calculateScore(value) {
    this.score += value;
    return this.score;
  }

  calculateRank(players) {
    const higherScores = players.filter((p) => p.score > this.score).length;
    const rank = higherScores + 1;
    return `Rank: ${rank}/${players.length}`;
  }
}

export default Player;
