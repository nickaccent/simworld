import config from '../config.js';
import { Building } from './building.js';

export class FireStation extends Building {
  constructor(x, y) {
    super(x, y);
    this.type = 'fire';
    this.name = generateStationName();

    // Citizens that work here
    this.workers = [];
    // Maximum number of workers this building can support
    this.maxWorkers = 4;

    /**
     * True if this zone has access to a road
     */
    this.hasRoadAccess = false;

    /**
     * The building level (1, 2 or 3)
     * @type {number}
     */
    this.level = 1;
  }
  /**
   * Returns the number of job openings
   * @returns {number}
   */
  numberOfJobsAvailable() {
    // Otherwise return the number of vacant positions
    return this.maxWorkers - this.workers.length;
  }

  /**
   * Returns the number of positions that are filled
   * @returns {number}
   */
  numberOfJobsFilled() {
    return this.workers.length;
  }

  /**
   * Performs a full refresh of the building state
   * @param {City} city
   */
  refresh(city) {
    this.checkRoadAccess(city);
  }

  /**
   * Updates the state of this building by one simulation step
   * @param {City} city
   */
  step(city) {
    super.step(city);

    // Check to see if this zone's development criteria are met. If they
    // are, the zone has a non-zero chance of developing a building
    // if (this.checkDevelopmentCriteria()) {
    //   this.abandonmentCounter = 0;
    //   if (Math.random() < config.zone.developmentChance) {
    //     this.abandoned = false;
    //     this.developed = true;
    //     this.isMeshOutOfDate = true;
    //   }

    //   // If the zone has failed to meet its basic requirements
    //   // for enough time, there is a chance of the zone becoming abandoned
    // } else {
    //   this.abandonmentCounter++;
    //   if (this.abandonmentCounter >= config.zone.abandonmentThreshold) {
    //     if (Math.random() < config.zone.abandonmentChance) {
    //       this.abandoned = true;
    //       this.isMeshOutOfDate = true;
    //     }
    //   }
    // }
  }

  /**
   * Checks nearby tiles to see if a road is available. This check
   * is only triggered when `refresh()` is called.
   * @param {City} city
   */
  checkRoadAccess(city) {
    const road = city.findTile(
      this,
      (tile) => {
        return tile.road !== null;
      },
      config.zone.maxRoadSearchDistance,
    );

    if (road) {
      this.hasRoadAccess = true;
    } else {
      this.hasRoadAccess = false;
    }
  }

  /**
   * Returns an HTML representation of this object
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    html += `Road Access: ${this.hasRoadAccess}<br>`;
    html += `Level: ${this.level}<br>`;
    html += `<br><strong>Workers (${this.numberOfJobsFilled()}/${this.maxWorkers})</strong>`;

    html += '<ul style="margin-top: 0; padding-left: 20px;">';
    if (this.workers.length > 0) {
      for (const worker of this.workers) {
        html += worker.toHTML();
      }
    } else {
      html += '<li>None</li>';
    }
    html += '</ul>';
    return html;
  }
}

const streetNames = [
  'Maplewood',
  'Oakridge',
  'Cedarbrook',
  'Willowdale',
  'Pineville',
  'Riverbend',
  'Hazelwood',
  'Bayside',
  'Meadowbrook',
  'Sunset',
  'Evergreen',
  'Sapphire',
  'Crimson Hills',
  'Golden Gate',
  'Silverton',
  'Emerald Bay',
  'Amberwood',
  'Copperfield',
  'Diamondville',
  'Ruby',
  'Topaz',
  'Sapphire',
  'Opal Creek',
  'Graniteville',
  'Pearlbrook',
  'Jade Harbor',
  'Cobalt Cove',
  'Amethyst',
  'Quartzville',
  'Onyx Bay',
  'Garnet Grove',
  'Crystal Falls',
  'Aurora',
  'Silverbrook',
  'Rubyvale',
  'Emerald',
  'Sapphire Sands',
  'Citrine Shores',
  'Amber Ridge',
  'Obsidian Lake',
  'Bronzeville',
  'Marbleton',
  'Copper Canyon',
  'Jasper',
  'Peridot',
  'Moonstone',
  'Turquoise',
  'Aquamarine',
];

const suffixes = [
  'Drive',
  'Valley',
  'Road',
  'Street',
  'Ridge',
  'Pines',
  'Lane',
  'Boulevard',
  'Trails',
  'Beach',
  'Heights',
];

function generateStationName() {
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return streetName + ' ' + suffix + ' Fire Station';
}
