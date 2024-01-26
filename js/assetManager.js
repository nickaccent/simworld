import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Tile } from './tile.js';
import models from './models.js';

export class AssetManager {
  textureLoader = new THREE.TextureLoader();
  gltfLoader = new GLTFLoader();
  modelLoader = new GLTFLoader();
  cubeGeometry = new THREE.BoxGeometry(1.01, 1, 1.01);

  meshes = {};

  /* Texture library */
  // Credit: https://opengameart.org/content/free-urban-textures-buildings-apartments-shop-fronts
  textures = {
    // grass: this.loadTexture('/textures/grass.png'),
    base: this.loadTexture('/textures/fiveTone.jpg'),
  };

  puffs = [
    0, 0.09765625, 0.1953125, 0.29296875, 0.390625, 0.48828125, 0.5859375, 0.68359375, 0.78125,
    0.87890625, 0.9765625, 1.07421875,
  ];

  constructor(onLoad) {
    this.modelCount = Object.keys(models).length;
    this.loadedModelCount = 0;

    for (const [name, meta] of Object.entries(models)) {
      this.loadModel(name, meta);
    }

    this.onLoad = onLoad;
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

  /**
   * Creates a new mesh for a ground tile
   * @param {Tile} tile
   * @returns {THREE.Mesh}
   */
  createGroundMesh(tile) {
    const material = new THREE.MeshLambertMaterial({ color: 0x0b8008 });
    const mesh = new THREE.Mesh(this.cubeGeometry, material);
    mesh.userData = tile;
    mesh.position.set(tile.x, -0.5, tile.y);
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Creates a new building mesh
   * @param {Tile} tile The tile the building sits on
   * @returns {THREE.Mesh | null}
   */
  createBuildingMesh(tile, city, scene) {
    if (!tile?.building) return null;

    if (tile?.trees !== null && tile?.trees.length > 0) {
      // we need to remove the trees
      for (let i = 0; i < tile.trees.length; i++) {
        scene.remove(tile.trees[i]);
      }
    }

    switch (tile.building?.type) {
      case 'residential':
      case 'commercial':
      case 'industrial':
        return this.createZoneMesh(tile, city);
      case 'police':
        return this.createUtilityMesh(tile, city, 'police');
      case 'fire':
        return this.createUtilityMesh(tile, city, 'fire');
      case 'hospital':
        return this.createUtilityMesh(tile, city, 'hospital');
      case 'power':
        return this.createUtilityMesh(tile, city, 'power');
      case 'water':
        return this.createUtilityMesh(tile, city, 'water');
      default:
        console.warn(`Mesh type ${tile.building?.type} is not recognized.`);
        return null;
    }
  }

  /**
   * Creates a new mesh for a zone
   * @param {Tile} tile The tile that the zone sits on
   * @returns {THREE.Mesh} A mesh object
   */
  createZoneMesh(tile, city) {
    const zone = tile.building;
    const modelName = `${zone.type}-${zone.style}${zone.level}`;

    // If zone is not yet developed, show it as under construction
    if (!zone.developed) {
      let cubeGeometry = new THREE.BoxGeometry(1, 0.025, 1);
      let material = undefined;
      if (zone.type === 'residential') {
        material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      } else if (zone.type === 'commercial') {
        material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
      } else if (zone.type === 'industrial') {
        material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      }
      const mesh = new THREE.Mesh(cubeGeometry, material);
      mesh.position.set(zone.x, 0, zone.y);
      mesh.userData = tile;
      return mesh;
    }

    let mesh = this.getMesh(modelName);

    tile.building.entrance_marker = {
      x: mesh.userData.entrance_marker_x,
      z: mesh.userData.entrance_marker_z,
    };
    tile.building.exit_marker = { x: mesh.userData.exit_marker_x, z: mesh.userData.exit_marker_z };
    // check if needs rotation
    let connections = this.getConnections(tile, city);
    if (connections.connectionsCount > 0) {
      if (connections.connections.left) {
        let connectedTile = city.getTile(tile.x + 1, tile.y);
        if (connectedTile.road) {
          tile.building.rotation = 90;
          mesh.rotateY((Math.PI / 2) * 1);
        }
      } else if (connections.connections.right) {
        let connectedTile = city.getTile(tile.x - 1, tile.y);
        if (connectedTile.road) {
          tile.building.rotation = 270;
          mesh.rotateY((Math.PI / 2) * 3);
        }
      } else if (connections.connections.down) {
        let connectedTile = city.getTile(tile.x, tile.y - 1);
        if (connectedTile.road) {
          tile.building.rotation = 180;
          mesh.rotateY((Math.PI / 2) * 2);
        }
      } else {
        tile.building.rotation = 0;
      }
    }
    mesh.position.set(zone.x + mesh.userData.xPos, mesh.userData.yPos, zone.y + mesh.userData.zPos);
    mesh.userData = tile;

    let markerGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let markerMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    let markerMesh = new THREE.Mesh(markerGeom, markerMat);
    markerMesh.position.set(tile.building.entrance_marker.x, 0.16, tile.building.entrance_marker.z);
    markerMesh.visible = false;
    mesh.add(markerMesh);

    tile.markerMesh = markerMesh;
    tile.meshPosition = mesh.position;

    if (zone.type === 'industrial') {
      if (tile.smoke === null) {
        let smoke = new THREE.Group();
        var material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
        });

        for (var i = 0; i < this.puffs.length; i++)
          smoke.add(new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), material));

        for (var i = 0; i < smoke.children.length; i++) {
          smoke.children[i].geometry.computeVertexNormals();
          smoke.children[i].position.setX(Math.random() * 0.1);
          smoke.children[i].position.setZ(Math.random() * 0.1);
          smoke.children[i].rotation.x = Math.random();
          smoke.children[i].rotation.y = Math.random();
          smoke.children[i].rotation.z = Math.random();
        }

        smoke.name = 'smoke';
        tile.smoke = smoke;
        smoke.position.set(tile.x - 0.25, 1, tile.y + 0.25);
        if (tile.building.rotation === 0) {
          smoke.position.set(tile.x + 0.17, 1, tile.y - 0.3);
        } else if (tile.building.rotation === 90) {
          smoke.position.set(tile.x - 0.3, 1, tile.y - 0.25);
        } else if (tile.building.rotation === 180) {
          smoke.position.set(tile.x - 0.25, 1, tile.y + 0.25);
        } else if (tile.building.rotation === 270) {
          smoke.position.set(tile.x + 0.22, 1, tile.y + 0.17);
        } else {
          tile.smoke = null;
        }
      }
    }

    if (zone.abandoned) {
      for (let i = 0; i < mesh.children[0].children.length; i++) {
        mesh.children[0].children[i].material.color.set(0x231709);
      }
    }
    return mesh;
  }

  createUtilityMesh(tile, city, type) {
    let modelName = `police-1`;
    const zone = tile.building;
    if (type === 'police') {
      modelName = `police-1`;
    } else if (type === 'fire') {
      modelName = 'fire-1';
    } else if (type === 'hospital') {
      modelName = 'hospital-1';
    } else if (type === 'power') {
      modelName = 'power-1';
    } else if (type === 'water') {
      modelName = 'water-1';
    }
    let mesh = this.getMesh(modelName);

    tile.building.entrance_marker = {
      x: mesh.userData.entrance_marker_x,
      z: mesh.userData.entrance_marker_z,
    };
    tile.building.exit_marker = { x: mesh.userData.exit_marker_x, z: mesh.userData.exit_marker_z };
    // check if needs rotation
    let connections = this.getConnections(tile, city);
    if (connections.connectionsCount > 0) {
      if (connections.connections.left) {
        let connectedTile = city.getTile(tile.x + 1, tile.y);
        if (connectedTile.road) {
          tile.building.rotation = 270;
          mesh.rotateY((Math.PI / 2) * 3);
        }
      } else if (connections.connections.right) {
        let connectedTile = city.getTile(tile.x - 1, tile.y);
        if (connectedTile.road) {
          tile.building.rotation = 90;
          mesh.rotateY((Math.PI / 2) * 1);
        }
      } else if (connections.connections.down) {
      } else {
        let connectedTile = city.getTile(tile.x, tile.y + 1);
        if (connectedTile.road) {
          tile.building.rotation = 180;
          mesh.rotateY((Math.PI / 2) * 2);
        }
      }
    }
    mesh.position.set(zone.x + mesh.userData.xPos, mesh.userData.yPos, zone.y + mesh.userData.zPos);

    mesh.userData = tile;

    if (type === 'power') {
      if (tile.smoke === null) {
        let smoke = new THREE.Group();
        var material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
        });

        for (var i = 0; i < this.puffs.length; i++)
          smoke.add(new THREE.Mesh(new THREE.IcosahedronGeometry(10, 0), material));

        for (var i = 0; i < smoke.children.length; i++) {
          smoke.children[i].geometry.computeVertexNormals();
          smoke.children[i].position.setX(Math.random() * 0.1);
          smoke.children[i].position.setZ(Math.random() * 0.1);
          smoke.children[i].rotation.x = Math.random();
          smoke.children[i].rotation.y = Math.random();
          smoke.children[i].rotation.z = Math.random();
        }

        smoke.name = 'smoke';

        let smoke2 = smoke.clone();

        smoke.position.set(tile.x - 1.125, 0.75, tile.y);
        smoke2.position.set(tile.x - 1.125, 0.75, tile.y - 0.75);

        let smoke3 = new THREE.Group();

        for (var i = 0; i < this.puffs.length; i++)
          smoke3.add(new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), material));

        for (var i = 0; i < smoke.children.length; i++) {
          smoke3.children[i].geometry.computeVertexNormals();
          smoke3.children[i].position.setX(Math.random() * 0.1);
          smoke3.children[i].position.setZ(Math.random() * 0.1);
          smoke3.children[i].rotation.x = Math.random();
          smoke3.children[i].rotation.y = Math.random();
          smoke3.children[i].rotation.z = Math.random();
        }
        let smoke4 = smoke3.clone();
        smoke3.position.set(tile.x + 0.225, 1.6, tile.y - 0.1);
        smoke4.position.set(tile.x - 0.225, 1.6, tile.y - 0.1);

        tile.smoke = [smoke, smoke2, smoke3, smoke4];
        // if (tile.building.rotation === 0) {
        //   smoke.position.set(tile.x + 0.17, 1, tile.y - 0.3);
        // } else if (tile.building.rotation === 90) {
        //   smoke.position.set(tile.x - 0.3, 1, tile.y - 0.25);
        // } else if (tile.building.rotation === 180) {
        //   smoke.position.set(tile.x - 0.25, 1, tile.y + 0.25);
        // } else if (tile.building.rotation === 270) {
        //   smoke.position.set(tile.x + 0.22, 1, tile.y + 0.17);
        // } else {
        //   tile.smoke = null;
        // }
      }
    } else if (type === 'water') {
      let smoke = new THREE.Group();
      var material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
      });

      for (var i = 0; i < this.puffs.length; i++)
        smoke.add(new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), material));

      for (var i = 0; i < smoke.children.length; i++) {
        smoke.children[i].geometry.computeVertexNormals();
        smoke.children[i].position.setX(Math.random() * 0.1);
        smoke.children[i].position.setZ(Math.random() * 0.1);
        smoke.children[i].rotation.x = Math.random();
        smoke.children[i].rotation.y = Math.random();
        smoke.children[i].rotation.z = Math.random();
      }

      smoke.name = 'smoke';

      smoke.position.set(tile.x + 0.125, 1, tile.y - 0.15);
      tile.smoke = smoke;
    }

    let markerGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let markerMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    let markerMesh = new THREE.Mesh(markerGeom, markerMat);
    markerMesh.position.set(tile.building.entrance_marker.x, 0.16, tile.building.entrance_marker.z);
    markerMesh.visible = false;
    mesh.add(markerMesh);

    tile.markerMesh = markerMesh;
    tile.meshPosition = mesh.position;

    return mesh;
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

  createTreeMesh(treeType, tile, scene) {
    const texture = new THREE.TextureLoader().load('/textures/fiveTone.jpg');
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    if (treeType === 1) {
      this.gltfLoader.load('/models/Nature/Tree1.glb', (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        mesh.traverse((node) => {
          if (node.material !== undefined) {
            let oldMat = node.material;
            let newMat = new THREE.MeshToonMaterial({
              color: oldMat.color,
              gradientMap: texture,
            });
            node.material = newMat;
          }
        });
        let minx = tile.x - 0.45;
        let maxx = tile.x + 0.45;
        let miny = tile.y - 0.45;
        let maxy = tile.y + 0.45;

        let x = Math.random() * (maxx - minx) + minx;
        let z = Math.random() * (maxy - miny) + miny;

        mesh.position.set(x, -0.18, z);
        tile.trees.push(mesh);
        scene.add(mesh);
      });
    } else {
      this.gltfLoader.load('/models/Nature/Tree2.glb', (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        mesh.traverse((node) => {
          if (node.material !== undefined) {
            let oldMat = node.material;
            let newMat = new THREE.MeshToonMaterial({
              color: oldMat.color,
              gradientMap: texture,
            });
            node.material = newMat;
          }
        });
        let minx = tile.x - 0.45;
        let maxx = tile.x + 0.45;
        let miny = tile.y - 0.45;
        let maxy = tile.y + 0.45;

        let x = Math.random() * (maxx - minx) + minx;
        let z = Math.random() * (maxy - miny) + miny;

        mesh.position.set(x, -0.05, z);
        tile.trees.push(mesh);
        scene.add(mesh);
      });
    }
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
}
