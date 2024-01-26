import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PathFinder } from '../PathFinder.js';
import config from '../config.js';

export class Person {
  constructor(x, y, personManager, mesh, sceneManager, city, start, end) {
    this.id = crypto.randomUUID();
    this.x = x;
    this.y = y;
    this.sceneManager = sceneManager;
    this.personManager = personManager;
    this.pathFinder = new PathFinder(city);
    this.pathMarkers = this.pathFinder.doPathFinding('person', start, end, city);

    this.markerGeom = new THREE.BoxGeometry(0.025, 0.025, 0.025);
    this.markerMat = new THREE.MeshLambertMaterial({ color: 0x00ffff });

    this.pathStep = 0;
    this.mesh = mesh;
    this.markerCount = 1;
    this.direction = new THREE.Matrix4();

    this.isFading = true;
    this.visible = false;
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.0;
      }
    });
    let startPos = this.pathMarkers[this.pathStep][0];
    this.mesh.position.set(startPos.x, 0.01, startPos.z);
    this.opacity = 0.0;
    this.fadeInMesh();
    if (config.debug === true) {
      this.renderPathMarkers();
    }
  }

  fadeInMesh() {
    let person = this;
    let myInterval = setInterval(function () {
      if (person.opacity.toFixed(2) === parseFloat(1.0).toFixed(2)) {
        clearInterval(myInterval);
        person.isFading = false;
        person.visible = true;
      }
      person.mesh.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = person.opacity;
        }
      });
      person.opacity += 0.05;
    }, 5);
  }

  fadeOutMesh() {
    this.isFading = true;
    let person = this;
    let myInterval = setInterval(function () {
      if (person.opacity.toFixed(2) === parseFloat(0.0).toFixed(2)) {
        clearInterval(myInterval);
        person.isFading = false;
        person.visible = false;
      }
      person.mesh.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = person.opacity;
        }
      });
      person.opacity -= 0.05;
    }, 5);
    let markers = this.sceneManager.scene.getObjectByName(`markers_${this.id}`);
    this.sceneManager.scene.remove(markers);
  }

  generateMarker(pos, markerMat) {
    let markerMesh = new THREE.Mesh(this.markerGeom, markerMat);
    markerMesh.position.set(pos.x, pos.y, pos.z);
    return markerMesh;
  }

  renderPathMarkers() {
    let person = this;
    const markersGroup = new THREE.Group();
    markersGroup.name = `markers_${this.id}`;
    this.pathMarkers.forEach((markers) => {
      //   console.log(marker);
      markers.forEach((marker) => {
        markersGroup.add(this.generateMarker(marker, person.markerMat.clone()));
      });
    });
    this.sceneManager.scene.add(markersGroup);
  }

  /**
   * Updates the state of this building by one simulation step
   */
  step(dt) {
    if (this.isFading === false && this.visible === true) {
      if (this.pathStep < this.pathMarkers.length) {
        const markers = this.pathMarkers[this.pathStep];
        let totalMarkersCount = markers.length;
        let currentMarker = markers[this.markerCount];

        currentMarker.y = 0.01;
        // get distance to marker
        const distance = currentMarker.clone().sub(this.mesh.position);
        if (distance.lengthSq() > 0.0001) {
          // this.mesh.position.lerp(currentMarker, 0.01);
          distance.normalize();
          distance.multiplyScalar(dt * 0.3);
          this.mesh.position.add(distance);
          let directionVector = currentMarker.clone().sub(this.mesh.position);
          directionVector.normalize();
          directionVector.multiplyScalar(dt * 0.3);
          const m = new THREE.Matrix4();
          this.direction.lookAt(
            new THREE.Vector3(0, 0, 0),
            directionVector,
            new THREE.Vector3(0, 1, 0),
          );
          this.mesh.quaternion.setFromRotationMatrix(this.direction);
        } else {
          if (this.markerCount < totalMarkersCount - 1) {
            this.markerCount++;
          } else {
            this.pathStep++;
            this.markerCount = 0;
          }
        }
      } else {
        if (this.isFading === false && this.visible === true) {
          this.fadeOutMesh();
        }
      }
    }
  }
}
