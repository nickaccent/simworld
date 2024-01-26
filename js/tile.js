import { Building } from './buildings/building.js';
import { createBuilding } from './buildings/buildingFactory.js';

export class Tile {
  /**
   * Creates a new `Tile` object
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   */
  constructor(x, y) {
    /**
     * Unique identifier for this tile
     * @type {string}
     */
    this.id = crypto.randomUUID();

    /**
     * The x-coordinate of the tile
     * @type {number}
     */
    this.x = x;

    /**
     * The y-coordinate of the tile
     * @type {number}
     */
    this.y = y;

    /**
     * The type of terrain
     * @type {string}
     */
    this.terrain = 'ground';

    /**
     * The building on this tile
     * @type {Building?}
     */
    this.building = null;
    this.road = null;
    this.trees = null;
    this.smoke = null;

    this.puffs = [
      0, 0.09765625, 0.1953125, 0.29296875, 0.390625, 0.48828125, 0.5859375, 0.68359375, 0.78125,
      0.87890625, 0.9765625, 1.07421875,
    ];
  }

  /**
   * Gets the Manhattan distance between two tiles
   * @param {Tile} tile
   * @returns
   */
  distanceTo(tile) {
    return Math.abs(this.x - tile.x) + Math.abs(this.y - tile.y);
  }

  /**
   * Performs a full refresh of the tile state
   * @param {City} city
   */
  refresh(city) {
    this.building?.refresh(city);
  }

  /**
   * Get Neighbours
   * @param {City} city
   */
  getNeighbours(city) {
    return city.getTileNeighbors(this.x, this.y);
  }

  /**
   * Removes the building from this tile
   */
  removeBuilding() {
    this.building?.dispose();
    this.building = null;
  }

  /**
   * Removes the road from this tile
   */
  removeRoad() {
    this.road?.dispose();
    this.road = null;
  }

  /**
   * Places a new building onto the tile
   * @param {string} type The building type to create
   */
  placeBuilding(type) {
    this.building = createBuilding(this.x, this.y, type);
  }

  /**
   * Places a new road onto the tile
   */
  placeRoad() {
    this.road = createBuilding(this.x, this.y, 'road');
  }

  /**
   *
   * @returns {string} HTML representation of this object
   */
  toHTML() {
    let html = '';
    html += `Coordinates: (X: ${this.x}, Y: ${this.y})<br>`;
    html += `Terrain: ${this.terrain}<br>`;

    if (this.building) {
      html += this.building.toHTML();
    }

    return html;
  }

  update() {
    if (this.smoke !== null) {
      if (Array.isArray(this.smoke)) {
        this.smoke.forEach((smoke) => {
          this.updateSmoke(smoke);
        });
      } else {
        this.updateSmoke(this.smoke);
      }
    }
  }

  updateSmoke(smoke) {
    for (var i = 0; i < this.puffs.length; i++) {
      if (this.puffs[i] >= 0.8) this.puffs[i] = 0;
      else this.puffs[i] = this.puffs[i] + 0.01;
      smoke.children[i].position.setY(this.puffs[i]);
      smoke.children[i].scale.setScalar(Math.sin((this.puffs[i] / 100.0) * Math.PI));
      smoke.children[i].rotateX(Math.sin(this.puffs[i] / 250.0));
      smoke.children[i].rotateY(Math.sin(this.puffs[i] / 250.0));
      smoke.children[i].rotateZ(Math.sin(this.puffs[i] / 250.0));
    }
  }
}
