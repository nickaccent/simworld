import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import models from './vehicleModels.js';
import { Car } from './car.js';

export class VehicleManager {
  textureLoader = new THREE.TextureLoader();

  modelLoader = new GLTFLoader();

  textures = {
    base: this.loadTexture('/textures/fiveTone.jpg'),
  };

  meshes = {};

  constructor(sceneManager, wheelMaterial, onLoad) {
    this.modelCount = Object.keys(models).length;
    this.loadedModelCount = 0;
    this.sceneManager = sceneManager;
    this.wheelMaterial = wheelMaterial;

    for (const [name, meta] of Object.entries(models)) {
      this.loadModel(name, meta);
    }
    this.cars = [];

    this.onLoad = onLoad;
  }

  /**
   * Load the 3D models
   * @param {string} url The URL of the model to load
   */
  loadModel(name, { filename, scale = 1 }) {
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
          if (child.material !== undefined) {
            let oldMat = child.material;
            let newMat = new THREE.MeshToonMaterial({
              color: oldMat.color,
              gradientMap: texture,
            });
            newMat.name = oldMat.name;
            child.material = newMat;
          }
        });

        mesh.position.set(0, 0, 0);
        mesh.scale.set(scale, scale, scale);
        mesh.userData = {};
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
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
      }
    });
    return mesh;
  }

  loadTexture(url) {
    const tex = this.textureLoader.load(url);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  addCar(parkingSpot, direction) {
    console.log(direction);
    const car = new Car(
      parkingSpot.position.x,
      parkingSpot.position.z,
      direction,
      'red',
      this.sceneManager,
      this.wheelMaterial,
      this,
    );
  }

  createCar(x, y, city, start, end) {
    // let mesh = this.getMesh('person');

    // mesh.position.set(x, 0.01, y);
    // this.people.add(mesh);

    // let person = new Person(x, y, this, mesh, sceneManager, city, start, end);
    // this.peopleObjects.push(person);
    // return mesh;

    const car = new Car(
      x,
      y,
      this,
      this.sceneManager,
      city,
      0, // direction
      'red',
      this.wheelMaterial,
    );
    car.pathFind(start, end, city);
    this.cars.push(car);
  }

  step(dt) {
    this.cars.forEach((car) => {
      car.step(dt);
    });
  }
}
