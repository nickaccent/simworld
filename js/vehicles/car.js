import * as THREE from 'three';
import { VertexTangentsHelper } from 'three/addons/helpers/VertexTangentsHelper.js';
import { VehiclePathFinder } from './VehiclePathfinder.js';
import * as CANNON from 'cannon-es';

export class Car extends THREE.Group {
  // constructor(x, y, startDirection, color, sceneManager, wheelMaterial, vehicleManager) {
  constructor(x, y, vehicleManager, sceneManager, city, startDirection, color, wheelMaterial) {
    super();
    this.x = x;
    this.y = y;
    (this.startDirection = startDirection), (this.color = color);
    const game = sceneManager;
    this.sceneManager = sceneManager;
    const car = this;
    const pathReady = false;
    this.markerCount = 1;
    this.fraction = 0;
    this.normal = new THREE.Vector3(0, 1, 0); // up
    this.moving = false;
    this.totalDistanceToNextMarker = 0;
    this.steerY = 0;

    this.pathFinder = new VehiclePathFinder(sceneManager, city);

    this.vehicle = new THREE.Group();
    this.add(this.vehicle);
    this.carMesh = vehicleManager.getMesh('car1');
    this.carMesh.traverse((child) => {
      if (child.isMesh) {
        if (child.material.name === 'Base') {
          child.material.color.setHex(this.getRandomCarColor());
        }
      }
    });
    this.wheels = new THREE.Group();
    let leftWheelMesh = vehicleManager.getMesh('wheelLeft');
    let rightWheelMesh = vehicleManager.getMesh('wheelRight');

    this.backWheels = new THREE.Group();
    this.wheelBackLeft = leftWheelMesh.clone();
    this.wheelBackLeft.position.set(0.08, 0.035, -0.135);
    this.wheelBackLeft.rotation.order = 'YXZ';
    this.backWheels.add(this.wheelBackLeft);

    this.wheelBackRight = rightWheelMesh.clone();
    this.wheelBackRight.position.set(-0.08, 0.035, -0.135);
    this.wheelBackRight.rotation.order = 'YXZ';
    this.backWheels.add(this.wheelBackRight);
    this.backWheels.name = 'frontWheels';

    this.frontWheels = new THREE.Group();
    this.wheelFrontLeft = leftWheelMesh.clone();
    this.wheelFrontLeft.position.set(0.08, 0.035, 0.105);
    this.wheelFrontLeft.rotation.order = 'YXZ';
    this.frontWheels.add(this.wheelFrontLeft);

    this.wheelFrontRight = rightWheelMesh.clone();
    this.wheelFrontRight.position.set(-0.08, 0.035, 0.105);
    this.wheelFrontRight.rotation.order = 'YXZ';
    this.frontWheels.add(this.wheelFrontRight);
    this.frontWheels.name = 'frontWheels';

    this.wheels.add(this.backWheels);
    this.wheels.add(this.frontWheels);
    this.vehicle.add(this.wheels);

    this.vehicle.add(this.carMesh);
    this.sceneManager.scene.add(this);
  }

  /**
   * Updates the state of this building by one simulation step
   * @param {City} city
   */
  step(dt) {
    let tangent;
    this.updateMatrixWorld();
    // this.drawAxesHelper();
    if (this.fraction >= 0 && this.fraction < 0.98) {
      if (this.moving === false) this.moving = true;
    } else {
      this.moving = false;
    }
    if (this.fraction < 0.98) {
      let axisX = new THREE.Vector3(1, 0, 0);
      if (this.startDirection === 90) {
        axisX = new THREE.Vector3(-1, 0, 0);
      }
      if (this.startDirection === 180) {
        axisX = new THREE.Vector3(-1, 0, 0);
      }
      if (this.startDirection === 270) {
        axisX = new THREE.Vector3(1, 0, 0);
      }

      let speed = 0.01;
      let fractionVal = speed / this.curve.getPoints().length;
      this.fraction += fractionVal;
      this.position.copy(this.curve.getPointAt(this.fraction));

      tangent = this.curve.getTangentAt(this.fraction);
      this.quaternion.setFromUnitVectors(axisX, tangent);
    }
    if (this.moving) {
      const axisY = new THREE.Vector3(-1, 0, 0);
      this.wheelBackRight.rotation.x += 0.2;
      this.wheelBackLeft.rotation.x += 0.2;
      this.wheelFrontRight.rotation.x += 0.2;
      this.wheelFrontLeft.rotation.x += 0.2;
    }
  }
  // }

  getMarkerDistance(currentMarker) {
    return currentMarker.clone().sub(this.vehicle.position).lengthSq();
  }

  getCurrentMarker(markers) {
    let currentMarker = markers[this.markerCount];
    currentMarker.y = 0.01;
    return currentMarker;
  }

  drawAxesHelper() {
    let axesHelperObj = this.vehicle.getObjectByName('axesHelper');
    if (axesHelperObj === undefined) {
      var axesHelper = new THREE.AxesHelper(20);
      axesHelper.name = 'axesHelper';
      this.vehicle.add(axesHelper);
    }
  }

  drawAngleLines(currentMarker) {
    let sceneLine = this.sceneManager.scene.getObjectByName('line');
    if (sceneLine === undefined) {
      var line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([currentMarker, this.vehicle.position]),
        new THREE.LineBasicMaterial({ color: 0x000000 }),
      );
      line.name = 'line';
      this.sceneManager.scene.add(line);
    } else {
      this.sceneManager.scene.remove(sceneLine);
      var line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([currentMarker, this.vehicle.position]),
        new THREE.LineBasicMaterial({ color: 0x000000 }),
      );
      line.name = 'line';
      this.sceneManager.scene.add(line);
    }
  }

  /**
   * Handles any clean up needed before a building is removed
   */
  dispose() {
    this.traverse((obj) => obj.material?.dispose());
    this.removeFromParent();
  }

  getRandomCarColor() {
    const carColors = [
      0x000000, 0xffffff, 0xc0c0c0, 0x808080, 0x36454f, 0xff0000, 0x0000ff, 0x008000, 0xffff00,
      0xffa500, 0x800080, 0xffc0cb, 0xa52a2a, 0xf5f5dc, 0xffd700, 0xcd7f32, 0xdc143c, 0x008080,
      0x000080, 0x00ff00, 0x87ceeb, 0x40e0d0, 0xff00ff, 0x808000, 0x708090, 0x800000, 0xb87333,
      0x4b0082, 0xeae0c8, 0x191970,
    ];

    const randomIndex = Math.floor(Math.random() * carColors.length);
    return carColors[randomIndex];
  }

  pathFind(start, end, city) {
    let markers = this.pathFinder.doPathFinding('car', start, end, city);
    // console.log(markers);
    this.pathMarkers = markers.pathMarkers;
    this.pathStep = 0;
    if (this.pathMarkers.length > 1) {
      this.position.copy(
        new THREE.Vector3(
          this.pathMarkers[this.pathStep][0].x,
          0.001,
          this.pathMarkers[this.pathStep][0].z,
        ),
      );
      this.origin = this.pathMarkers[this.pathStep][0];
      this.startDirection = markers.direction;
      let axis = new CANNON.Vec3(1, 0, 0);
      let angle = (Math.PI / 2) * 1;
      if (this.startDirection === 90) {
        angle = (Math.PI / 2) * 2;
      }
      if (this.startDirection === 180) {
        angle = (Math.PI / 2) * 3;
      }
      if (this.startDirection === 270) {
        angle = (Math.PI / 2) * 4;
      }
      this.points = [];
      for (let i = 0; i < this.pathMarkers.length; i++) {
        for (let m = 0; m < this.pathMarkers[i].length; m++) {
          this.points.push(
            new THREE.Vector3(this.pathMarkers[i][m].x, 0.01, this.pathMarkers[i][m].z),
          );
        }
      }

      this.vehicle.rotation.y = angle;

      this.curve = new THREE.CatmullRomCurve3(this.points);
      this.curve.closed = false;
      this.curvePoints = this.curve.getPoints(60);
      //   const line = new THREE.LineLoop(
      //     new THREE.BufferGeometry().setFromPoints(this.curvePoints),
      //     new THREE.LineBasicMaterial({ color: 0xffffaa }),
      //   );
      //   this.sceneManager.scene.add(line);
    }
  }
}
