import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Person } from './people/person.js';
import models from './people/peopleModels.js';

export class PeopleManager {
  textureLoader = new THREE.TextureLoader();
  modelLoader = new GLTFLoader();

  meshes = {};

  textures = {
    base: this.loadTexture('/textures/fiveTone.jpg'),
  };
  constructor(onLoad, sceneManager) {
    this.modelCount = Object.keys(models).length;
    this.loadedModelCount = 0;

    for (const [name, meta] of Object.entries(models)) {
      this.loadModel(name, meta);
    }

    this.onLoad = onLoad;
    this.sceneManager = sceneManager;
    this.peopleObjects = [];
    this.people = new THREE.Group();
    this.people.name = 'people';
    this.sceneManager.scene.add(this.people);
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
          if (child.material !== undefined) {
            let oldMat = child.material;
            let newMat = new THREE.MeshToonMaterial({
              color: oldMat.color,
              gradientMap: texture,
            });
            child.material = newMat;
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

  /**
   * Creates a new mesh for a zone
   * @param {Tile} tile The tile that the zone sits on
   * @returns {THREE.Mesh} A mesh object
   */
  createPerson(x, y, city, sceneManager, start, end) {
    let mesh = this.getMesh('person');

    mesh.position.set(x, 0.01, y);
    this.people.add(mesh);

    let person = new Person(x, y, this, mesh, sceneManager, city, start, end);
    this.peopleObjects.push(person);
    return mesh;
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

  step(dt) {
    this.peopleObjects.forEach((person) => person.step(dt));
  }
}
