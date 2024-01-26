import * as THREE from 'three';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.125.2/examples/jsm/utils/BufferGeometryUtils.js';
import { createCameraManager } from './cameraManager.js';
import { AssetManager } from './assetManager.js';
import { RoadManager } from './roadManager.js';
import { VehicleManager } from './vehicles/vehicleManager.js';

import { PeopleManager } from './peopleManager.js';
import { City } from './city.js';
import {
  EffectComposer,
  Selection,
  SelectiveBloomEffect,
  RenderPass,
  EffectPass,
} from 'postprocessing';

/**
 * Manager for the Three.js scene. Handles rendering of a `City` object
 */
export class SceneManager {
  /**
   * Initializes a new Scene object
   * @param {City} city
   */
  constructor(city, onLoad) {
    this.city = city;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.precision = 'highp';
    this.renderer.powerPreference = 'high-performance';

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.sceneBuildings = new THREE.Group();
    this.sceneBuildings.name = 'buildings';
    this.scene.add(this.sceneBuildings);

    this.gameWindow = document.getElementById('render-target');
    this.assetManager = new AssetManager(() => {
      console.log('assets loaded');
      this.initialize(city);
      onLoad();
    });

    this.roadManager = new RoadManager(() => {
      console.log('road addon meshes loaded');
      onLoad();
    });

    this.vehicleManager = new VehicleManager(this, this.wheelMaterial, () => {
      console.log('vehicles loaded');
      onLoad();
    });

    this.peopleManager = new PeopleManager(() => {
      console.log('people loaded');
      onLoad();
    }, this);

    this.cameraManager = createCameraManager(this.gameWindow);

    // Configure the renderer
    this.renderer.setSize(this.gameWindow.offsetWidth, this.gameWindow.offsetHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.selectedObjectsForBloom = new Selection();

    this.selectiveBloom = new SelectiveBloomEffect(this.scene, this.cameraManager.camera, {
      intensity: 4,
      luminanceThreshold: 0.1,
      mipmapBlur: false,
      radius: 0.17,
    });

    // For performance.
    this.selectiveBloom.ignoreBackground = true;

    this.selectiveBloom.selection = this.selectedObjectsForBloom;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.cameraManager.camera);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(new EffectPass(this.cameraManager.camera, this.selectiveBloom));

    /**
     * 2D array of building meshes at each tile location
     * @type {THREE.Mesh[][]}
     */
    this.buildings = [];
    this.roads = [];
    this.trafficLights = [];

    // Add the renderer to the DOM
    this.gameWindow.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.onResize.bind(this), false);

    this.debug = true;
    const game = this;

    // Variables for object selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Last object the user has clicked on
    this.activeObject = null;
    // Object the mouse is currently hovering over
    this.hoverObject = null;
  }

  setSelectionForBloomEffect(model, bloomTarget) {
    model.traverse((object) => {
      if (object.isMesh) {
        if (bloomTarget === 'green') {
          if (object.userData.green) {
            this.selectedObjectsForBloom.add(object);
          }
        }
        if (bloomTarget === 'red') {
          if (object.userData.red) {
            this.selectedObjectsForBloom.add(object);
          }
        }
        if (bloomTarget === 'amber') {
          if (object.userData.amber) {
            this.selectedObjectsForBloom.add(object);
          }
        }
      }
    });
  }

  /**
   * Initalizes the scene, clearing all existing assets
   */
  initialize(city) {
    this.sceneBuildings.clear();
    this.buildings = [];
    this.trafficLights = [];

    // Initialize the buildings array
    for (let x = 0; x < city.size; x++) {
      const column = [];
      for (let y = 0; y < city.size; y++) {
        const tile = city.getTile(x, y);
        const mesh = this.assetManager.createGroundMesh(tile);
        this.sceneBuildings.add(mesh);
        column.push(mesh);
        let rnd = Math.floor(Math.random() * 50) + 1;
        if (rnd >= 30) {
          tile.trees = [];
          let treeType = Math.floor(Math.random() * 2) + 1;
          let rndTrees = Math.floor(Math.random() * 5) + 1;
          for (var i = 0; i < rndTrees; i++) {
            this.assetManager.createTreeMesh(treeType, tile, this.sceneBuildings);
          }
        }
      }
      this.buildings.push([...Array(city.size)]);
      this.roads.push([...Array(city.size)]);
    }

    this.setupLights();
    // this.scene.background = new THREE.Color().setHSL(0.6, 0, 0.2);
    // this.scene.fog = new THREE.Fog(this.scene.background, 1, 5000);
  }

  /**
   * Setup the lights for the scene
   */
  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
    this.scene.add(hemiLightHelper);

    //

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    this.scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;

    const d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    // this.scene.add(dirLightHelper);
  }

  /**
   * Applies the latest changes in the data model to the scene
   * @param {City} city The city data model
   */
  applyChanges(city) {
    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        const tile = city.getTile(x, y);
        const existingBuildingMesh = this.buildings[x][y];
        const existingRoadMesh = this.roads[x][y];
        // If the player removes a building, remove it from the this.scene
        if (!tile.building && existingBuildingMesh) {
          this.sceneBuildings.remove(existingBuildingMesh);
          this.buildings[x][y] = null;
        }

        // If the player removes a road, remove it from the this.scene
        if (!tile.road && existingRoadMesh) {
          this.roadManager.bulldozeRoad(city, tile);
          // We dont need to remove the mesh as the updateRoads function will deal
          // with this, so just remove from this.roads[x][y]
          this.roads[x][y] = null;
        }
        // If the data model has changed, update the mesh
        if (tile.building && tile.building.isMeshOutOfDate) {
          this.sceneBuildings.remove(existingBuildingMesh);
          this.buildings[x][y] = this.assetManager.createBuildingMesh(
            tile,
            city,
            this.sceneBuildings,
          );
          this.sceneBuildings.add(this.buildings[x][y]);
          if (tile.smoke !== null) {
            if (Array.isArray(tile.smoke)) {
              for (var i = 0; i < tile.smoke.length; i++) {
                this.sceneBuildings.add(tile.smoke[i]);
              }
            } else {
              this.sceneBuildings.add(tile.smoke);
            }
          }
          tile.building.isMeshOutOfDate = false;
        }
        // If the data model has changed, update the mesh
        if (tile.road && tile.road.isMeshOutOfDate) {
          this.roads[x][y] = this.roadManager.createRoadGeom(tile, city, this.sceneBuildings);
          tile.road.isMeshOutOfDate = false;
        }

        if (tile.road && tile.road.trafficLights.length > 0) {
          for (let i = 0; i < tile.road.trafficLights.length; i++) {
            let entries = this.trafficLights.filter((tl) => tl.id == tile.road.trafficLights[i].id);
            if (entries.length === 0) {
              this.trafficLights.push(tile.road.trafficLights[i]);
              this.scene.add(tile.road.trafficLights[i].mesh);
            }
          }
        } else {
          let entries = this.trafficLights.filter((tl) => tl.x === tile.x && tl.y === tile.y);
          let scene = this.scene;
          entries.forEach((tl) => {
            scene.remove(tl.mesh);
            scene.trafficLights.splice(scene.trafficLights.indexOf(tl), 1);
          });
        }
      }
    }
    this.updateRoads(city);
  }

  updateRoads(city) {
    let beds = [];
    let kerbs = [];
    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        if (this.roads[x][y] && this.roads[x][y] !== undefined) {
          const tile = city.getTile(x, y);
          beds.push(tile.road.bedGeom);
          kerbs.push(tile.road.kerbGeom);
        }
      }
    }

    if (beds.length > 0) {
      const roadBedsGeom = BufferGeometryUtils.mergeBufferGeometries(beds);
      const roadKerbsGeom = BufferGeometryUtils.mergeBufferGeometries(kerbs);
      const mixedGeoms = [];
      mixedGeoms.push(roadBedsGeom);
      mixedGeoms.push(roadKerbsGeom);
      const roadFinalGeom = BufferGeometryUtils.mergeBufferGeometries(mixedGeoms);

      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        // side: THREE.DoubleSide,
        // wireframe: true,
      });

      const mesh = new THREE.Mesh(roadFinalGeom, material);
      mesh.name = 'roads';
      mesh.position.set(0, 0.001, 0);
      this.sceneBuildings.remove(this.roadMesh);
      this.roadMesh = mesh;
      this.roadMesh.castShadow = true;
      this.roadMesh.receiveShadow = true;
      this.roadMesh.userData = {
        toHTML: () => 'road',
        type: 'road',
      };
      this.sceneBuildings.add(this.roadMesh);
    } else {
      this.sceneBuildings.remove(this.roadMesh);
    }
  }

  /**
   * Starts the renderer
   */
  start() {
    this.renderer.setAnimationLoop(this.draw.bind(this));
  }

  /**
   * Stops the renderer
   */
  stop() {
    this.renderer.setAnimationLoop(null);
  }

  /**
   * Render the contents of the this.scene
   */
  draw() {
    const now = Date.now();
    if (this.lastTime === undefined) this.lastTime = now;
    const dt = (Date.now() - this.lastTime) / 1000.0;
    this.lastTime = now;

    if (this.city !== undefined) {
      for (let x = 0; x < this.city.size; x++) {
        for (let y = 0; y < this.city.size; y++) {
          const tile = this.city.getTile(x, y);
          tile.update();
        }
      }
    }
    this.peopleManager.step(dt);
    this.vehicleManager.step(dt);

    this.selectedObjectsForBloom = new Selection();
    let sceneM = this;

    this.trafficLights.forEach((tl) => {
      if (tl.activeSignal === 'green') {
        tl.mesh.traverse((child) => {
          if (child.material !== undefined) {
            if (child.userData.green) {
              child.material.emissive.setHex(0x008450);
              child.material.emissiveIntensity = 10;
            } else {
              child.material.emissive.setHex(0x000000);
              child.material.emissiveIntensity = 0;
            }
          }
          sceneM.setSelectionForBloomEffect(tl.mesh, 'green');
        });
      } else if (tl.activeSignal === 'amber') {
        tl.mesh.traverse((child) => {
          if (child.material !== undefined) {
            if (child.userData.amber) {
              child.material.emissive.setHex(0xefb700);
              child.material.emissiveIntensity = 10;
            } else {
              child.material.emissive.setHex(0x000000);
              child.material.emissiveIntensity = 0;
            }
          }
          sceneM.setSelectionForBloomEffect(tl.mesh, 'amber');
        });
      } else if (
        tl.activeSignal === 'red' ||
        tl.activeSignal === 'red1' ||
        tl.activeSignal === 'red2'
      ) {
        tl.mesh.traverse((child) => {
          if (child.material !== undefined) {
            if (child.userData.red) {
              child.material.emissive.setHex(0xb81d13);
              child.material.emissiveIntensity = 10;
            } else {
              child.material.emissive.setHex(0x000000);
              child.material.emissiveIntensity = 0;
            }
          }
          sceneM.setSelectionForBloomEffect(tl.mesh, 'red');
        });
      }
    });
    this.selectiveBloom.selection = this.selectedObjectsForBloom;
    // this.composer.render();
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  /**
   * Sets the object that is currently highlighted
   * @param {THREE.Mesh} mesh
   */
  setHighlightedMesh(mesh) {
    // Unhighlight the previously hovered object (if it isn't currently selected)
    if (this.hoverObject && this.hoverObject !== this.activeObject) {
      this.setMeshEmission(this.hoverObject, 0x000000);
    }

    this.hoverObject = mesh;

    if (this.hoverObject) {
      // Highlight the new hovered object (if it isn't currently selected))
      this.setMeshEmission(this.hoverObject, 0x555555);
    }
  }

  /**
   * Sets the emission color of the mesh
   * @param {THREE.Mesh} mesh
   * @param {number} color
   */
  setMeshEmission(mesh, color) {
    if (!mesh) return;
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.emissive?.setHex(color));
    } else {
      mesh.material.emissive?.setHex(color);
    }
  }

  /**
   * Gets the mesh currently under the this.mouse cursor. If there is nothing under
   * the this.mouse cursor, returns null
   * @param {MouseEvent} event Mouse event
   * @returns {THREE.Mesh?}
   */
  getSelectedObject(event) {
    // Compute normalized this.mouse coordinates
    this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.cameraManager.camera);

    let intersections = this.raycaster.intersectObjects(this.sceneBuildings.children, false);
    if (intersections.length > 0) {
      return intersections[0];
    } else {
      return null;
    }
  }

  /**
   * Sets the currently selected object and highlights it
   * @param {object} object
   */
  setActiveObject(object) {
    // Clear highlight on previously active object
    this.setMeshEmission(this.activeObject, 0x000000);
    this.activeObject = object;
    // Highlight new active object
    this.setMeshEmission(this.activeObject, 0xaaaa55);
  }

  /**
   * Resizes the renderer to fit the current game window
   */
  onResize() {
    this.cameraManager.camera.aspect = this.gameWindow.offsetWidth / this.gameWindow.offsetHeight;
    this.cameraManager.camera.updateProjectionMatrix();
    this.renderer.setSize(this.gameWindow.offsetWidth, this.gameWindow.offsetHeight);
  }
}
