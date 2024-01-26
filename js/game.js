import { SceneManager } from './sceneManager.js';
import { City } from './city.js';

export class Game {
  selectedControl = document.getElementById('button-select');
  activeToolId = 'select';
  isPaused = false;

  focusedObject = null;
  lastMove = new Date();

  constructor() {
    /**
     * The city data model
     * @type {City}
     */
    this.city = new City(32);
    this.day = 0;
    this.hour = 0;
    this.minute = 0;

    this.sceneManager = new SceneManager(this.city, () => {
      console.log('scene loaded');
      this.sceneManager.start();
      setInterval(this.step.bind(this), 1000);
    });

    document.addEventListener(
      'wheel',
      this.sceneManager.cameraManager.onMouseScroll.bind(this),
      false,
    );
    document.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    document.addEventListener(
      'contextmenu',
      (event) => {
        event.preventDefault();
        if (this.selectedControl) {
          this.selectedControl.classList.remove('selected');
        }
        this.selectedControl = document.getElementById('button-select');
        this.selectedControl.classList.add('selected');
        this.activeToolId = 'select';
      },
      false,
    );

    this.pathStart = undefined;
    this.pathEnd = undefined;
    this.carPathStart = undefined;
    this.carPathEnd = undefined;

    // Start update interval
    setInterval(this.step.bind(this), 1000);
  }

  step() {
    if (this.isPaused) return;
    // Update the city data model first, then update the scene
    this.city.step();
    this.sceneManager.applyChanges(this.city);
    this.updateTitleBar();
    this.updateInfoOverlay();
    this.minute += 0.5;
    if (this.minute === 60) {
      this.hour += 1;
      this.minute = 0;
    }
    if (this.hour === 24) {
      this.day += 1;
      this.hour = 0;
    }
    document.getElementById('day').innerHTML = this.day;
    document.getElementById('hour').innerHTML = this.hour < 10 ? `0${this.hour}` : this.hour;
    document.getElementById('minute').innerHTML =
      this.minute < 10 ? `0${Math.round(this.minute)}` : Math.round(this.minute);
  }

  onToolSelected(event) {
    event.stopPropagation();
    // Deselect previously selected button and selected this one
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = event.target;
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    console.log(`Is Paused: ${this.isPaused}`);
    if (this.isPaused) {
      document.getElementById('pause-button-icon').src = 'public/icons/play.png';
    } else {
      document.getElementById('pause-button-icon').src = 'public/icons/pause.png';
    }
  }

  onMouseDown(event) {
    // Check if left mouse button pressed
    if (event.button === 0) {
      const selectedObject = this.sceneManager.getSelectedObject(event);
      this.useActiveTool(selectedObject);
    }
  }

  onMouseMove(event) {
    // Throttle event handler so it doesn't kill the browser
    if (Date.now() - this.lastMove < 1 / 60.0) return;
    this.lastMove = Date.now();

    // Get the object the mouse is currently hovering over
    let hoverObject = this.sceneManager.getSelectedObject(event);
    hoverObject = hoverObject?.object;

    this.sceneManager.setHighlightedMesh(hoverObject);

    // If left mouse-button is down, use the tool as well
    if (hoverObject && event.buttons & 1) {
      this.useActiveTool(hoverObject);
    }

    this.sceneManager.cameraManager.onMouseMove(event);
  }

  useActiveTool(selectedObject) {
    // If no object is selected, clear the info panel
    let object = selectedObject?.object;
    if (!object) {
      this.updateInfoOverlay(null);
      return;
    } else {
      const tile = object.userData;
      if (this.activeToolId === 'select') {
        if (object.name === 'roads') {
          const tile = this.city.getTile(
            Math.round(selectedObject.point.x),
            Math.round(selectedObject.point.z),
          );
          this.sceneManager.setActiveObject(object);
          this.focusedObject = object;

          const text = `<strong>Road</strong><br/>Coordinates: ${tile.x}, ${tile.y}<br/>Type: ${tile.road.type}<br>Rotation: ${tile.road.rotation}<br/>Width: ${tile.road.width}`;

          this.updateInfoOverlay(text);
        } else {
          this.sceneManager.setActiveObject(object);
          this.focusedObject = tile;
          this.updateInfoOverlay();
        }
      } else if (this.activeToolId === 'bulldoze') {
        if (object.name === 'roads') {
          const tile = this.city.getTile(
            Math.round(selectedObject.point.x),
            Math.round(selectedObject.point.z),
          );
          tile.removeRoad();
          this.city.refresh();
          this.sceneManager.applyChanges(this.city);
        } else {
          if (tile.building) {
            tile.removeBuilding();
            this.city.refresh();
            this.sceneManager.applyChanges(this.city);
          }
        }
      } else if (this.activeToolId === 'road') {
        tile.placeRoad();
        this.city.refresh();
        this.sceneManager.applyChanges(this.city);
      } else if (this.activeToolId === 'person') {
        const tile = this.city.getTile(
          Math.round(selectedObject.point.x),
          Math.round(selectedObject.point.z),
        );
        this.createPath(tile);
      } else if (this.activeToolId === 'car') {
        const tile = this.city.getTile(
          Math.round(selectedObject.point.x),
          Math.round(selectedObject.point.z),
        );
        this.createCarPath(tile);
      } else if (!tile.building) {
        const buildingType = this.activeToolId;
        tile.placeBuilding(buildingType);
        this.city.refresh();
        this.sceneManager.applyChanges(this.city);
      }
    }
  }

  updateInfoOverlay(text = null) {
    if (text === null) {
      if (this.focusedObject?.name != 'roads') {
        document.getElementById('info-overlay-details').innerHTML =
          this.focusedObject?.toHTML() ?? '';
      }
    } else {
      document.getElementById('info-overlay-details').innerHTML = text;
    }
  }
  updateTitleBar() {
    document.getElementById('population-counter').innerHTML = this.city.getPopulation();
  }

  createPath(tile) {
    if (this.pathStart === undefined) {
      if (tile.building) {
        this.pathStart = tile;
      }
    } else {
      if (tile.building) {
        this.pathEnd = tile;
        this.sceneManager.peopleManager.createPerson(
          this.pathStart.x,
          this.pathStart.y,
          this.city,
          this.sceneManager,
          this.pathStart,
          this.pathEnd,
        );
        this.pathStart = undefined;
        this.pathEnd = undefined;
      }
    }
  }

  createCarPath(tile) {
    if (this.carPathStart === undefined) {
      if (tile.road) {
        this.carPathStart = tile;
      }
    } else {
      if (tile.road) {
        this.carPathEnd = tile;
        this.sceneManager.vehicleManager.createCar(
          this.carPathStart.x,
          this.carPathStart.y,
          this.city,
          this.carPathStart,
          this.carPathEnd,
        );
        this.carPathStart = undefined;
        this.carPathEnd = undefined;
      }
    }
  }
  // spawnCars() {
  //   const straightRoads = [];

  //   for (let x = 0; x < this.city.size; x++) {
  //     for (let y = 0; y < this.city.size; y++) {
  //       const tile = this.city.getTile(x, y);
  //       if (tile.road) {
  //         if (
  //           tile.road.type === 'Straight' &&
  //           (tile.road.parkingSpots[0].inUse === false || tile.road.parkingSpots[1].inUse === false)
  //         ) {
  //           console.log(tile);
  //           straightRoads.push(tile);
  //         }
  //       }
  //     }
  //   }
  //   if (straightRoads.length > 0) {
  //     // for(let i=0; i<straightRoads.length * 2 -2; i++){
  //     let randomIndex = Math.floor(Math.random() * straightRoads.length);
  //     let road = straightRoads[randomIndex];
  //     if (road.road.parkingSpots[0].inUse === false) {
  //       road.road.parkingSpots[0].inUse = true;
  //       let rotation = 0;
  //       if (road.road.rotation === 0) {
  //         rotation = 180;
  //       } else {
  //         rotation = 90;
  //       }
  //       this.sceneManager.vehicleManager.addCar(road.road.parkingSpots[0], rotation);
  //     } else {
  //       // spot 0 is in use so use spot 1 then mark as in use and remove this road from the array as both spots in use
  //       road.road.parkingSpots[1].inUse = true;
  //       let rotation = 0;
  //       if (road.road.rotation === 0) {
  //         rotation = 0;
  //       } else {
  //         rotation = 270;
  //       }
  //       this.sceneManager.vehicleManager.addCar(road.road.parkingSpots[1], rotation);
  //       straightRoads.splice(randomIndex, 1);
  //     }
  //     // this.sceneManager.vehicleManager.addCar();
  //     // }
  //   }
  //   // do this for multiple cars
  //   // spawn instance of car and draw the mesh.
  //   // add physics engine to mesh

  //   // Create a journey (at random intervals) for each cars, this should probably have a journeys based system
  //   // so that multiple journeys or activities can be queued up but for now we will keep it one at a time and simple/random

  //   // 1: decide on a start building and get nearest parking place to start building
  //   // 2: decide on an end building and get nearest parking place to end building

  //   // 3: pathfind from start parking place to start road tile exit marker
  //   // use A* from start road exit marker to end road entrance marker
  //   // pathfind from end entrance marker to end parking position

  //   // animate mesh using physics impulses from start point to end point.
  // }
}
