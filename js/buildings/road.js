import { Building } from './building.js';
import { Zone } from './zone.js';

export class Road extends Building {
  constructor(x, y) {
    super(x, y);
    this.type = 'road';
    this.rotation = 0;
    this.width = 0;
    this.bedGeom = null;
    this.kerbGeom = null;
    /**
     * True if the mesh is out of date and needs to be regenerated
     * @type {boolean}
     */
    this.isMeshOutOfDate = true;

    this.trafficLights = [];
  }
}
