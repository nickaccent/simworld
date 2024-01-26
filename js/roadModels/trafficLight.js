export class TrafficLight {
  constructor(x, y, mesh, signal, prev) {
    this.x = x;
    this.y = y;

    /**
     * Unique identifier for this building
     * @type {string}
     */
    this.id = crypto.randomUUID();

    this.mesh = mesh;
    this.isMeshRendered = false;
    this.rotation = 0;
    this.activeSignal = signal;
    this.prevSignal = prev;
    let tl = this;
    setInterval(function () {
      if (tl.activeSignal === 'green') {
        tl.activeSignal = 'amber';
        tl.prevSignal = 'green';
      } else if (tl.activeSignal === 'amber' && tl.prevSignal === 'green') {
        tl.activeSignal = 'red';
        tl.prevSignal = 'amber';
      } else if (tl.activeSignal === 'amber' && tl.prevSignal === 'red2') {
        tl.activeSignal = 'green';
        tl.prevSignal = 'amber';
      } else if (tl.activeSignal === 'red') {
        tl.activeSignal = 'red1';
        tl.prevSignal = 'red';
      } else if (tl.activeSignal === 'red1') {
        tl.activeSignal = 'red2';
        tl.prevSignal = 'red1';
      } else if (tl.activeSignal === 'red2') {
        tl.activeSignal = 'amber';
        tl.prevSignal = 'red2';
      }
    }, 5000);
  }

  /**
   * Updates the state of this building by one simulation step
   * @param {City} city
   */
  step(activeLight) {}

  /**
   * Handles any clean up needed before a building is removed
   */
  dispose() {}
}
