import * as THREE from 'three';
import { Tile } from './tile.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TrafficLight } from './roadModels/trafficLight.js';
import { createStart } from './roadModels/start.js';
import { createEnd } from './roadModels/end.js';
import { createStraight } from './roadModels/straight.js';
import { createCurved } from './roadModels/curved.js';
import { createThreeWay } from './roadModels/threeWay.js';
import { createFourWay } from './roadModels/fourWay.js';
import models from './roadModels/models.js';
export class RoadManager {
  textureLoader = new THREE.TextureLoader();
  modelLoader = new GLTFLoader();

  meshes = {};

  /* Texture library */
  // Credit: https://opengameart.org/content/free-urban-textures-buildings-apartments-shop-fronts
  textures = {
    // grass: this.loadTexture('/textures/grass.png'),
    base: this.loadTexture('/textures/fiveTone.jpg'),
  };

  constructor(onLoad) {
    this.width = 0.75;
    this.modelCount = Object.keys(models).length;
    this.loadedModelCount = 0;

    for (const [name, meta] of Object.entries(models)) {
      this.loadModel(name, meta);
    }

    this.onLoad = onLoad;
  }

  /**
   * Creates a new Road Geom
   * @param {Tile} tile The tile the building sits on
   * @returns object two params bed and kerb of geometries
   */
  createRoadGeom(tile, city, scene) {
    if (!tile?.road) return null;

    if (tile?.trees !== null && tile?.trees.length > 0) {
      // we need to remove the trees
      for (let i = 0; i < tile.trees.length; i++) {
        scene.remove(tile.trees[i]);
      }
    }

    // front
    // -1, -1, 1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1,
    // back
    // 1, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, 1, -1,
    // left
    // -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1,
    // right
    // 1, -1, 1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, -1,
    // top
    // 1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, 1,
    // bottom
    // 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, -1,

    this.updateRoadNeighbourGeom(tile, city, this.width);

    let connections = this.getConnections(tile, city);
    this.generateRoadForTile(tile, connections, this.width);
    return { roadCreated: true, id: crypto.randomUUID(), tile_id: tile.id, x: tile.x, y: tile.y };
  }

  updateRoadNeighbourGeom(tile, city, width) {
    const neighbours = tile.getNeighbours(city);
    if (neighbours.length > 0) {
      for (var i = 0; i < neighbours.length; i++) {
        if (neighbours[i].road) {
          let neighbourConnections = this.getConnections(neighbours[i], city);
          this.generateRoadForTile(neighbours[i], neighbourConnections, width);
        }
      }
    }
  }

  getConnections(tile, city) {
    const neighbours = tile.getNeighbours(city);
    let connectionsCount = 0;
    let connections = {
      left: undefined,
      right: undefined,
      up: undefined,
      down: undefined,
    };
    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i]?.road) {
        connectionsCount++;
        if (neighbours[i].x < tile.x) connections.right = true;
        if (neighbours[i].x > tile.x) connections.left = true;
        if (neighbours[i].y < tile.y) connections.down = true;
        if (neighbours[i].y > tile.y) connections.up = true;
      }
    }
    return {
      connectionsCount,
      connections,
    };
  }

  generateRoadGeometryModel(road, connections, width) {
    const kerbHeight = 0.015;
    const roadColor = [24, 24, 24];
    const kerbColor = [188, 171, 161];
    const roadWidth = width;
    let model = undefined;
    let type = undefined;
    let rotation = undefined;
    if (connections.connectionsCount === 0) {
      model = createStart(road, roadWidth, kerbHeight, road.x, road.y, roadColor, kerbColor);
      type = 'Start';
      rotation = 0;
    }
    if (connections.connectionsCount === 1) {
      if (connections.connections.left) {
        model = createEnd(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'west',
        );
        type = 'End';
        rotation = 0;
      } else if (connections.connections.right) {
        model = createEnd(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'east',
        );
        rotation = 180;
        type = 'End';
      } else if (connections.connections.up) {
        model = createEnd(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'north',
        );
        type = 'End';
        rotation = 270;
      } else {
        model = createEnd(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'south',
        );
        type = 'End';
        rotation = 90;
      }
    } else if (connections.connectionsCount === 2) {
      // curved or straight
      if (connections.connections.left && connections.connections.right) {
        model = createStraight(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'east',
        );
        type = 'Straight';
        rotation = 0;
        road.parkingSpots = [
          {
            position: new THREE.Vector3(road.x, 0.05, road.y + road.width / 2 - road.width / 16),
            inUse: false,
          },
          {
            position: new THREE.Vector3(road.x, 0.05, road.y - road.width / 2 + road.width / 16),
            inUse: false,
          },
        ];
      } else if (connections.connections.up && connections.connections.down) {
        model = createStraight(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'north',
        );
        type = 'Straight';
        rotation = 90;
        road.parkingSpots = [
          {
            position: new THREE.Vector3(road.x + road.width / 2 - road.width / 16, 0.05, road.y),
            inUse: false,
          },
          {
            position: new THREE.Vector3(road.x - road.width / 2 + road.width / 16, 0.05, road.y),
            inUse: false,
          },
        ];
      } else if (connections.connections.left && connections.connections.down) {
        // <--- //
        //    | //
        //    V //
        model = createCurved(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'up-left',
        );
        type = 'Curved';
        rotation = 270;
      } else if (connections.connections.right && connections.connections.down) {
        // ---> //
        // |    //
        // V    //
        model = createCurved(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'up-right',
        );
        type = 'Curved';
        rotation = 0;
      } else if (connections.connections.right && connections.connections.up) {
        // |    //
        // |    //
        // ---> //
        model = createCurved(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'down-right',
        );
        type = 'Curved';
        rotation = 90;
      } else if (connections.connections.left && connections.connections.up) {
        //    | //
        //    | //
        // <--- //
        model = createCurved(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'down-left',
        );
        type = 'Curved';
        rotation = 180;
      }
    } else if (connections.connectionsCount === 3) {
      if (
        connections.connections.left &&
        connections.connections.right &&
        connections.connections.up
      ) {
        //    /\     //
        //    ||     //
        // <------>  //
        model = createThreeWay(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'left-right-up',
        );
        type = 'Three Way';
        rotation = 0;
        // we want to add at least one traffic light to the road
        if (road.trafficLights.length === 0) {
          const trafficLight1 = new TrafficLight(
            road.x,
            road.y,
            this.getMesh('trafficLight'),
            'green',
            'amber',
          );
          let mesh = this.getMesh('trafficLight');
          mesh.userData.parent_id = trafficLight1.id;
          mesh.name = 'trafficLight';
          let pwidth = (1 - road.width) / 2;
          mesh.position.set(road.x + 0.5 - pwidth / 2, -0.01, road.y + 0.5 - pwidth / 2);
          trafficLight1.mesh = mesh;
          road.trafficLights.push(trafficLight1);

          const trafficLight2 = new TrafficLight(
            road.x,
            road.y,
            this.getMesh('trafficLight'),
            'red',
            'amber',
          );
          let mesh2 = this.getMesh('trafficLight');
          mesh2.userData.parent_id = trafficLight2.id;
          mesh2.name = 'trafficLight';
          pwidth = (1 - road.width) / 2;
          mesh2.position.set(road.x - 0.5 + pwidth / 2, -0.01, road.y + 0.5 - pwidth / 2);
          mesh2.rotation.y = -Math.PI / 2;
          trafficLight2.mesh = mesh2;
          road.trafficLights.push(trafficLight2);

          const trafficLight3 = new TrafficLight(
            road.x,
            road.y,
            this.getMesh('trafficLight'),
            'red2',
            'red1',
          );
          let mesh3 = this.getMesh('trafficLight');
          mesh3.userData.parent_id = trafficLight3.id;
          mesh3.name = 'trafficLight';
          pwidth = (1 - road.width) / 2;
          mesh3.position.set(road.x - 0.5 + pwidth / 2, -0.01, road.y - 0.5 + pwidth / 2);
          mesh3.rotation.y = (Math.PI / 2) * 2;
          trafficLight3.mesh = mesh3;
          road.trafficLights.push(trafficLight3);
        }
      } else if (
        connections.connections.left &&
        connections.connections.right &&
        connections.connections.down
      ) {
        // <------>  //
        //    ||     //
        //    \/     //
        model = createThreeWay(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'left-right-down',
        );
        type = 'Three Way';
        rotation = 180;
      } else if (
        connections.connections.up &&
        connections.connections.down &&
        connections.connections.left
      ) {
        //    /\     //
        // <--||     //
        //    \/     //
        model = createThreeWay(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'up-down-left',
        );
        type = 'Three Way';
        rotation = 90;
      } else if (
        connections.connections.up &&
        connections.connections.down &&
        connections.connections.right
      ) {
        //    /\     //
        //    ||-->  //
        //    \/     //
        model = createThreeWay(
          road,
          roadWidth,
          kerbHeight,
          road.x,
          road.y,
          roadColor,
          kerbColor,
          'up-down-right',
        );

        type = 'Three Way';
        rotation = 270;
      }
      // three way
    } else if (connections.connectionsCount === 4) {
      // four way
      model = createFourWay(road, roadWidth, kerbHeight, road.x, road.y, roadColor, kerbColor);
      type = 'Four Way';
      rotation = 0;
    }

    return { model, type, rotation };
  }

  generateRoadForTile(tile, connections, width) {
    const road = tile.road;
    tile.road.width = width;
    let roadGeom = this.generateRoadGeometryModel(road, connections, width);
    if (roadGeom.model !== undefined) {
      tile.road.bedGeom = roadGeom.model.bed;
      tile.road.kerbGeom = roadGeom.model.kerb;
    }
    if (roadGeom.type !== undefined) {
      tile.road.type = roadGeom.type;
    }
    if (roadGeom.rotation !== undefined) {
      tile.road.rotation = roadGeom.rotation;
    }
    tile.road.isMeshOutOfDate = true;
  }

  bulldozeRoad(city, tile) {
    this.updateRoadNeighbourGeom(tile, city, this.width);
  }

  /**
   * Loads the texture at the specified URL
   * @param {string} url
   * @returns {THREE.Texture} A texture object
   */
  loadTexture(url) {
    const tex = this.textureLoader.load(url);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  getModel(modelName) {
    return this.models[modelName].clone();
  }

  /**
   * Load the 3D models
   * @param {string} url The URL of the model to load
   */
  loadModel(
    name,
    {
      filename,
      scale = 1,
      entrance_marker_x,
      entrance_marker_z,
      exit_marker_x,
      exit_marker_z,
      yPos,
      xPos,
      zPos,
    },
  ) {
    const texture = this.textures.base;
    this.textures.base.minFilter = texture.magFilter = THREE.NearestFilter;
    this.modelLoader.load(
      `/${filename}`,
      (glb) => {
        const mesh = glb.scene;
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.userData.green || child.userData.red || child.userData.amber) {
            if (child.material !== undefined) {
              if (child.userData.green) {
                child.material.emissive.setHex(0x008450);
                child.material.emissiveIntensity = 1;
              }
              if (child.userData.red) {
                child.material.emissive.setHex(0x8b0000);
                child.material.emissiveIntensity = 1;
              }
              if (child.userData.yellow) {
                child.material.emissive.setHex(0xffff00);
                child.material.emissiveIntensity = 1;
              }
              child.material.toneMapped = false;
            }
          } else {
            if (child.material !== undefined) {
              let oldMat = child.material;
              let newMat = new THREE.MeshToonMaterial({
                color: oldMat.color,
                gradientMap: texture,
              });
              child.material = newMat;
            }
          }
        });

        mesh.position.set(0, 0, 0);
        mesh.scale.set(scale, scale, scale);
        mesh.userData = {
          entrance_marker_x,
          entrance_marker_z,
          exit_marker_x,
          exit_marker_z,
          yPos,
          xPos,
          zPos,
        };
        this.meshes[name] = mesh;

        // Once all models are loaded
        this.loadedModelCount++;
        if (this.loadedModelCount == this.modelCount) {
          this.onLoad();
        }
      },
      (xhr) => {
        // console.log(`${name} ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error(error);
      },
    );
  }

  getMesh(name) {
    const mesh = this.meshes[name].clone();
    // Clone materials so each object has a unique material
    // This is so we can set the modify the texture of each
    // mesh independently (e.g. highlight on mouse over,
    // abandoned buildings, etc.))

    mesh.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
      }
    });
    return mesh;
  }
}
