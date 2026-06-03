class Collectible {
  constructor({ x, y, value, id }) {
    this.x = x;
    this.y = y;
    this.value = value || 1;
    this.id = id;
  }
}

export default Collectible;
