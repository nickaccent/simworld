import * as THREE from 'three';
import { calculateCurveVertices } from './roadModels/helpers.js';

export class PathFinder {
  constructor(city) {
    this.size = city.size;
    this.path = undefined;
  }

  removeAllBefore(array, number) {
    let newArray = [];
    for (let i = number; i < array.length; i++) {
      newArray.push(array[i]);
    }
    return newArray;
  }

  removeAllAfter(array, number) {
    let newArray = [];
    for (let i = 0; i <= number; i++) {
      newArray.push(array[i]);
    }
    return newArray;
  }

  doPathFinding(type, startTile, endTile, city) {
    if (this.path != undefined) {
      this.path = undefined;
      this.startTile = undefined;
      this.endTile = undefined;
    }
    this.startTile = startTile;
    this.endTile = endTile;
    this.type = type;
    this.allMarkersGroup = new THREE.Group();
    this.allMarkersGroup.name = 'allMarkers';
    this.roads = [];

    this.pf = new PF.Grid(this.size, this.size);

    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        const tile = city.getTile(x, y);
        this.pf.setWalkableAt(x, y, false);
        if (tile.road) {
          this.roads.push(tile);
          this.pf.setWalkableAt(x, y, true);
        }
      }
    }
    this.pf.setWalkableAt(startTile.x, startTile.y, true);
    this.pf.setWalkableAt(endTile.x, endTile.y, true);
    this.startNode = this.pf.getNodeAt(startTile.x, startTile.y);
    this.endNode = this.pf.getNodeAt(endTile.x, endTile.y);

    this.pfBackup = this.pf.clone();

    const f = new PF.AStarFinder({ allowDiagonal: false, dontCrossCorners: true });
    this.path = f.findPath(
      this.startNode.x,
      this.startNode.y,
      this.endNode.x,
      this.endNode.y,
      this.pfBackup,
    );

    const pathMarkers = [];

    if (this.path.length > 0) {
      this.path.forEach((pathPoint, index) => {
        const tile = city.getTile(pathPoint[0], pathPoint[1]);
        if (index > 0 && index < this.path.length - 1) {
          let markers = undefined;
          let prevTile = undefined;
          const tile = city.getTile(pathPoint[0], pathPoint[1]);
          let nextTile = undefined;
          let isStart = false;
          let isEnd = false;
          if (index === 1) {
            isStart = true;
            nextTile = city.getTile(this.path[index + 1][0], this.path[index + 1][1]);
          } else if (index === this.path.length - 2) {
            prevTile = city.getTile(this.path[index - 1][0], this.path[index - 1][1]);
            isEnd = true;
          } else {
            nextTile = city.getTile(this.path[index + 1][0], this.path[index + 1][1]);
            prevTile = city.getTile(this.path[index - 1][0], this.path[index - 1][1]);
          }
          if (tile.road.type === 'End') {
            markers = this.getMarkersForEndType(tile.road.rotation, isStart, tile, type);
          } else if (tile.road.type === 'Straight') {
            markers = this.getMarkersForStraightType(
              tile.road.rotation,
              isStart,
              isEnd,
              tile,
              nextTile,
              prevTile,
              type,
            );
          } else if (tile.road.type === 'Curved') {
            markers = this.getMarkersForCurvedType(
              tile.road.rotation,
              isStart,
              isEnd,
              tile,
              nextTile,
              prevTile,
              type,
            );
          } else if (tile.road.type === 'Three Way') {
            markers = this.getMarkersForThreeWayType(
              tile.road.rotation,
              isStart,
              isEnd,
              tile,
              nextTile,
              prevTile,
              type,
            );
          } else if (tile.road.type === 'Four Way') {
            markers = this.getMarkersForFourWayType(
              tile.road.rotation,
              isStart,
              isEnd,
              tile,
              nextTile,
              prevTile,
              type,
            );
          }
          let newMarkers = [];
          if (isStart) {
            let prevTile = city.getTile(this.path[index - 1][0], this.path[index - 1][1]);
            let buildingMarkerPosition = new THREE.Vector3();
            prevTile.markerMesh.getWorldPosition(buildingMarkerPosition);

            let markersArr = this.buidMarkersArray(markers);
            let minIndex = this.getMinDistanceIndexForMarkersArray(
              markersArr,
              buildingMarkerPosition,
            );

            newMarkers = this.removeAllBefore(markersArr, minIndex);
            newMarkers.unshift(buildingMarkerPosition);
          } else if (isEnd) {
            let nextTile = city.getTile(this.path[index + 1][0], this.path[index + 1][1]);
            let buildingMarkerPosition = new THREE.Vector3();
            nextTile.markerMesh.getWorldPosition(buildingMarkerPosition);

            let markersArr = this.buidMarkersArray(markers);
            let minIndex = this.getMinDistanceIndexForMarkersArray(
              markersArr,
              buildingMarkerPosition,
            );

            newMarkers = this.removeAllAfter(markersArr, minIndex);
            newMarkers.push(buildingMarkerPosition);
          } else {
            newMarkers = this.buidMarkersArray(markers);
          }
          pathMarkers.push(newMarkers);
        }
      });
    }
    return pathMarkers;
  }

  buidMarkersArray(markers) {
    let markersArr = [];
    markersArr.push(markers.entranceMarker);
    for (let i = 0; i < markers.markers.length; i++) {
      markersArr.push(markers.markers[i]);
    }
    markersArr.push(markers.exitMarker);
    return markersArr;
  }

  getMinDistanceIndexForMarkersArray(markersArr, buildingMarkerPosition) {
    const distances = [];
    for (let i = 0; i < markersArr.length; i++) {
      distances.push(markersArr[i].clone().sub(buildingMarkerPosition).lengthSq());
    }
    let minimum = Math.min(...distances);
    let minIndex = distances.indexOf(minimum);
    return minIndex;
  }

  getMarkersForEndType(rotation, isStart, tile, type) {
    let entranceMarker = new THREE.Vector3(0, 0.05, 0);
    let exitMarker = new THREE.Vector3(0, 0.05, 0);
    let markers = [];

    let pwidth =
      type === 'person' ? (1 - tile.road.width) / 2 : tile.road.width + (1 - tile.road.width) / 2;
    // let pwidth = (1 - tile.road.width) /2;
    if (rotation === 0) {
      if (isStart) {
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y;

        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x - 0.5 + pwidth / 2;
        marker1.z = tile.y - 0.5 + pwidth / 2;
        markers.push(marker1);
      } else {
        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y;

        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x - 0.5 + pwidth / 2;
        marker1.z = tile.y + 0.5 - pwidth / 2;
        markers.push(marker1);
      }
    } else if (rotation === 90) {
      if (isStart) {
        entranceMarker.x = tile.x;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;

        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x - 0.5 + pwidth / 2;
        marker1.z = tile.y + 0.5 - pwidth / 2;
        markers.push(marker1);
      } else {
        exitMarker.x = tile.x;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;

        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x + 0.5 - pwidth / 2;
        marker1.z = tile.y + 0.5 - pwidth / 2;
        markers.push(marker1);
      }
    } else if (rotation === 180) {
      if (isStart) {
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y;

        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x + 0.5 - pwidth / 2;
        marker1.z = tile.y + 0.5 - pwidth / 2;
        markers.push(marker1);
      } else {
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y;

        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x + 0.5 - pwidth / 2;
        marker1.z = tile.y - 0.5 + pwidth / 2;
        markers.push(marker1);
      }
    } else if (rotation === 270) {
      if (isStart) {
        entranceMarker.x = tile.x;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;

        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x + 0.5 - pwidth / 2;
        marker1.z = tile.y - 0.5 + pwidth / 2;
        markers.push(marker1);
      } else {
        exitMarker.x = tile.x;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;

        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;

        let marker = new THREE.Vector3(0, 0.05, 0);
        let marker1 = marker.clone();
        marker1.x = tile.x - 0.5 + pwidth / 2;
        marker1.z = tile.y - 0.5 + pwidth / 2;
        markers.push(marker1);
      }
    }
    return { entranceMarker, exitMarker, markers };
  }

  getMarkersForStraightType(rotation, isStart, isEnd, tile, nextTile, prevTile, type) {
    let entranceMarker = new THREE.Vector3(0, 0.05, 0);
    let exitMarker = new THREE.Vector3(0, 0.05, 0);
    let markers = [];

    let pwidth =
      type === 'person' ? (1 - tile.road.width) / 2 : tile.road.width + (1 - tile.road.width) / 2;
    //let pwidth = (1 - tile.road.width) /2;
    if (rotation === 0) {
      if (isStart) {
        if (nextTile.x < tile.x) {
          // we are on the tile to right so the next tile will be to the left
          entranceMarker.x = tile.x;
          entranceMarker.z = tile.y + 0.5 - pwidth / 2;
          exitMarker.x = tile.x - 0.5 + pwidth / 2;
          exitMarker.z = tile.y + 0.5 - pwidth / 2;
        } else {
          // we are on the tile to the left so the next tile will be to the right
          entranceMarker.x = tile.x;
          entranceMarker.z = tile.y - 0.5 + pwidth / 2;
          exitMarker.x = tile.x + 0.5 - pwidth / 2;
          exitMarker.z = tile.y - 0.5 + pwidth / 2;
        }
      } else if (isEnd) {
        if (prevTile.x < tile.x) {
          // we are on the tile to left
          entranceMarker.x = tile.x - 0.5 + pwidth / 2;
          entranceMarker.z = tile.y - 0.5 + pwidth / 2;
          exitMarker.x = tile.x;
          exitMarker.z = tile.y - 0.5 + pwidth / 2;
        } else {
          // we are on the tile to the right
          entranceMarker.x = tile.x + 0.5 - pwidth / 2;
          entranceMarker.z = tile.y + 0.5 - pwidth / 2;
          exitMarker.x = tile.x;
          exitMarker.z = tile.y + 0.5 - pwidth / 2;
        }
      } else {
        if (prevTile.x < tile.x) {
          exitMarker.x = tile.x + 0.5 - pwidth / 2;
          exitMarker.z = tile.y - 0.5 + pwidth / 2;
          entranceMarker.x = tile.x - 0.5 + pwidth / 2;
          entranceMarker.z = tile.y - 0.5 + pwidth / 2;
        } else {
          exitMarker.x = tile.x - 0.5 + pwidth / 2;
          exitMarker.z = tile.y + 0.5 - pwidth / 2;
          entranceMarker.x = tile.x + 0.5 - pwidth / 2;
          entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        }
      }
    }
    if (rotation === 90) {
      if (isStart) {
        if (nextTile.y < tile.y) {
          // we are on the tile to right so the next tile will be to the left
          entranceMarker.x = tile.x - 0.5 + pwidth / 2;
          entranceMarker.z = tile.y;
          exitMarker.x = tile.x - 0.5 + pwidth / 2;
          exitMarker.z = tile.y - 0.5 + pwidth / 2;
        } else {
          // we are on the tile to the left so the next tile will be to the right
          entranceMarker.x = tile.x + 0.5 - pwidth / 2;
          entranceMarker.z = tile.y;
          exitMarker.x = tile.x + 0.5 - pwidth / 2;
          exitMarker.z = tile.y + 0.5 - pwidth / 2;
        }
      } else if (isEnd) {
        if (prevTile.y < tile.y) {
          // we are on the tile to left
          entranceMarker.x = tile.x + 0.5 - pwidth / 2;
          entranceMarker.z = tile.y - 0.5 + pwidth / 2;
          exitMarker.x = tile.x + 0.5 - pwidth / 2;
          exitMarker.z = tile.y;
        } else {
          // we are on the tile to the right
          entranceMarker.x = tile.x - 0.5 + pwidth / 2;
          entranceMarker.z = tile.y + 0.5 - pwidth / 2;
          exitMarker.x = tile.x - 0.5 + pwidth / 2;
          exitMarker.z = tile.y;
        }
      } else {
        if (prevTile.y < tile.y) {
          exitMarker.x = tile.x + 0.5 - pwidth / 2;
          exitMarker.z = tile.y + 0.5 - pwidth / 2;
          entranceMarker.x = tile.x + 0.5 - pwidth / 2;
          entranceMarker.z = tile.y - 0.5 + pwidth / 2;
        } else {
          exitMarker.x = tile.x - 0.5 + pwidth / 2;
          exitMarker.z = tile.y - 0.5 + pwidth / 2;
          entranceMarker.x = tile.x - 0.5 + pwidth / 2;
          entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        }
      }
    }
    return { entranceMarker, exitMarker, markers };
  }

  getMarkersForCurvedType(rotation, isStart, isEnd, tile, nextTile, prevTile, type) {
    let entranceMarker = new THREE.Vector3(0, 0.05, 0);
    let exitMarker = new THREE.Vector3(0, 0.05, 0);
    let markers = [];
    let pwidth =
      type === 'person' ? (1 - tile.road.width) / 2 : tile.road.width + (1 - tile.road.width) / 2;
    //let pwidth = (1 - tile.road.width) /2;
    if (rotation === 0) {
      if (prevTile.y < tile.y) {
        // we are curving up right
        let points = calculateCurveVertices(tile.road.width + (pwidth / 2) * 3, 6); // 5
        entranceMarker.x = tile.x + points[0].x;
        entranceMarker.z = tile.y + points[0].z;
        exitMarker.x = tile.x + points[points.length - 1].x;
        exitMarker.z = tile.y + points[points.length - 1].z;
        for (let i = 1; i < points.length - 2; i++) {
          markers.push(new THREE.Vector3(tile.x + points[i].x, 0.05, tile.y + points[i].z));
        }
      } else {
        // we are curving other way
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        exitMarker.x = tile.x + points[0].x;
        exitMarker.z = tile.y + points[0].z;
        entranceMarker.x = tile.x + points[points.length - 1].x;
        entranceMarker.z = tile.y + points[points.length - 1].z;
        markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      }
    }

    if (rotation === 90) {
      const axis = new THREE.Vector3(0, 1, 0);
      const angle = Math.PI / 2;
      if (prevTile.y > tile.y) {
        // we are curving down right
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[1].x;
        entranceMarker.z = tile.y + newPoints[1].z;
        exitMarker.x = tile.x + newPoints[newPoints.length - 1].x;
        exitMarker.z = tile.y + newPoints[newPoints.length - 1].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else {
        // we are curving other way
        let points = calculateCurveVertices(tile.road.width + (pwidth / 2) * 3, 6); // 5
        let newPoints = [];
        for (let i = 0; i <= points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[0].x;
        entranceMarker.z = tile.y + newPoints[0].z;
        exitMarker.x = tile.x + newPoints[points.length - 1].x;
        exitMarker.z = tile.y + newPoints[points.length - 1].z;
        for (let i = 1; i < newPoints.length - 1; i++) {
          markers.push(new THREE.Vector3(tile.x + newPoints[i].x, 0.05, tile.y + newPoints[i].z));
        }
      }
    }

    if (rotation === 180) {
      const axis = new THREE.Vector3(0, 1, 0);
      const angle = (Math.PI / 2) * 2;
      if (prevTile.y > tile.y) {
        // we are curving down left
        let points = calculateCurveVertices(tile.road.width + (pwidth / 2) * 3, 6); // 5
        let newPoints = [];
        for (let i = 0; i < points.length; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[0].x;
        entranceMarker.z = tile.y + newPoints[0].z;
        exitMarker.x = tile.x + newPoints[points.length - 1].x;
        exitMarker.z = tile.y + newPoints[points.length - 1].z;
        for (let i = 1; i < newPoints.length - 2; i++) {
          markers.push(new THREE.Vector3(tile.x + newPoints[i].x, 0.05, tile.y + newPoints[i].z));
        }
      } else {
        // we are curving other way
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[1].x;
        entranceMarker.z = tile.y + newPoints[1].z;
        exitMarker.x = tile.x + newPoints[newPoints.length - 1].x;
        exitMarker.z = tile.y + newPoints[newPoints.length - 1].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      }
    }

    if (rotation === 270) {
      const axis = new THREE.Vector3(0, 1, 0);
      const angle = (Math.PI / 2) * 3;
      if (prevTile.y < tile.y) {
        // we are curving down left
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[1].x;
        entranceMarker.z = tile.y + newPoints[1].z;
        exitMarker.x = tile.x + newPoints[newPoints.length - 1].x;
        exitMarker.z = tile.y + newPoints[newPoints.length - 1].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else {
        // we are curving other way
        let points = calculateCurveVertices(tile.road.width + (pwidth / 2) * 3, 6); // 5
        let newPoints = [];
        for (let i = 0; i < points.length; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[0].x;
        entranceMarker.z = tile.y + newPoints[0].z;
        exitMarker.x = tile.x + newPoints[points.length - 1].x;
        exitMarker.z = tile.y + newPoints[points.length - 1].z;
        for (let i = 1; i < newPoints.length - 2; i++) {
          markers.push(new THREE.Vector3(tile.x + newPoints[i].x, 0.05, tile.y + newPoints[i].z));
        }
      }
    }

    return { entranceMarker, exitMarker, markers };
  }

  getMarkersForThreeWayType(rotation, isStart, isEnd, tile, nextTile, prevTile, type) {
    let entranceMarker = new THREE.Vector3(0, 0.05, 0);
    let exitMarker = new THREE.Vector3(0, 0.05, 0);
    let markers = [];
    const axis = new THREE.Vector3(0, 1, 0);
    let angle = undefined;

    let pwidth =
      type === 'person' ? (1 - tile.road.width) / 2 : tile.road.width + (1 - tile.road.width) / 2;
    //let pwidth = (1 - tile.road.width) /2;
    if (rotation === 0) {
      if (prevTile.x < tile.x && nextTile.y === tile.y) {
        // from right to left
        entranceMarker.x = tile.x - 0.5;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
      } else if (prevTile.x < tile.x && nextTile.y > tile.y) {
        // we are curving other way
        angle = (Math.PI / 2) * 2;
        entranceMarker.x = tile.x - 0.5;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
        let marker = new THREE.Vector3(tile.x + 0.5, 0.05, tile.y - 0.5 + pwidth / 2);
        markers.push(marker);
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
        // markers.push(new THREE.Vector3(tile.x + newPoints[newPoints.length-1].x, 0.05, tile.y + newPoints[newPoints.length-1].z));
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else if (prevTile.y > tile.y && nextTile.x < tile.x) {
        angle = Math.PI / 2;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + newPoints[1].x;
        entranceMarker.z = tile.y + newPoints[1].z;
        exitMarker.x = tile.x + newPoints[newPoints.length - 1].x;
        exitMarker.z = tile.y + newPoints[newPoints.length - 1].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else if (prevTile.x > tile.x && nextTile.y === tile.y) {
        // from right to left
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x - 0.5;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;
      } else if (prevTile.y > tile.y && nextTile.x > tile.x) {
        angle = (Math.PI / 2) * 2;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
        markers.push(new THREE.Vector3(tile.x + newPoints[0].x, 0.05, tile.y + newPoints[0].z));
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
        markers.push(
          new THREE.Vector3(
            tile.x + newPoints[newPoints.length - 1].x,
            0.05,
            tile.y + newPoints[newPoints.length - 1].z,
          ),
        );
      } else if (prevTile.x > tile.x && nextTile.y > tile.y) {
        angle = (Math.PI / 2) * 2;
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      }
    } else if (rotation === 90) {
      if (prevTile.y < tile.y && nextTile.x === tile.x) {
        // from right to left
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
      } else if (prevTile.y > tile.y && nextTile.x === tile.x) {
        // from right to left
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5;
        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y - 0.5;
      } else if (prevTile.y > tile.y && nextTile.x > tile.x) {
        angle = (Math.PI / 2) * 2;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
        markers.push(new THREE.Vector3(tile.x + newPoints[0].x, 0.05, tile.y + newPoints[0].z));
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
        markers.push(
          new THREE.Vector3(
            tile.x + newPoints[newPoints.length - 1].x,
            0.05,
            tile.y + newPoints[newPoints.length - 1].z,
          ),
        );
      } else if (prevTile.x > tile.x && nextTile.y > tile.y) {
        angle = (Math.PI / 2) * 2;
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else if (prevTile.y < tile.y && nextTile.x > tile.x) {
        angle = (Math.PI / 2) * 3;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      } else if (prevTile.x > tile.x && nextTile.y < tile.y) {
        angle = (Math.PI / 2) * 2;
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y - 0.5;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
        markers.push(new THREE.Vector3(tile.x + newPoints[3].x, 0.05, tile.y + newPoints[3].z));
        markers.push(new THREE.Vector3(tile.x - 0.5 + pwidth / 2, 0.05, tile.y + 0.5));
      }
    } else if (rotation === 180) {
      if (prevTile.x < tile.x && nextTile.y === tile.y) {
        // from right to left
        entranceMarker.x = tile.x - 0.5;
        entranceMarker.z = tile.y - 0.5 + pwidth / 2;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
      } else if (prevTile.x > tile.x && nextTile.y === tile.y) {
        // from right to left
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x - 0.5;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;
      } else if (prevTile.y < tile.y && nextTile.x > tile.x) {
        angle = (Math.PI / 2) * 3;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;
        exitMarker.x = tile.x + 0.5;
        exitMarker.z = tile.y - 0.5 + pwidth / 2;
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      } else if (prevTile.y < tile.y && nextTile.x < tile.x) {
        angle = (Math.PI / 2) * 3;
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;
        exitMarker.x = tile.x - 0.5;
        exitMarker.z = tile.y + 0.5 - pwidth / 2;
        markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
        markers.push(new THREE.Vector3(tile.x + newPoints[0].x, 0.05, tile.y + newPoints[0].z));
        markers.push(new THREE.Vector3(tile.x + 0.5, 0.05, tile.y + 0.5 - pwidth / 2));
      } else if (prevTile.x < tile.x && nextTile.y < tile.y) {
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        entranceMarker.x = tile.x + points[points.length - 1].x;
        entranceMarker.z = tile.y + points[points.length - 1].z;
        exitMarker.x = tile.x + points[0].x;
        exitMarker.z = tile.y + points[0].z;
        markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      } else if (prevTile.x > tile.x && nextTile.y < tile.y) {
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        entranceMarker.x = tile.x + 0.5;
        entranceMarker.z = tile.y + 0.5 - pwidth / 2;
        exitMarker.x = tile.x + points[0].x;
        exitMarker.z = tile.y + points[0].z;
        markers.push(new THREE.Vector3(tile.x - 0.5, 0.05, tile.y + 0.5 - pwidth / 2));
        markers.push(
          new THREE.Vector3(
            tile.x + points[points.length - 1].x,
            0.05,
            tile.y + points[points.length - 1].z,
          ),
        );
        markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      }
    } else if (rotation === 270) {
      if (prevTile.y < tile.y && nextTile.x === tile.x) {
        // from right to left
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
      } else if (prevTile.y > tile.y && nextTile.x === tile.x) {
        // from right to left
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5;
        exitMarker.x = tile.x - 0.5 + pwidth / 2;
        exitMarker.z = tile.y - 0.5;
      } else if (prevTile.y < tile.y && nextTile.x < tile.x) {
        angle = (Math.PI / 2) * 1;
        entranceMarker.x = tile.x + 0.5 - pwidth / 2;
        entranceMarker.z = tile.y - 0.5;

        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        exitMarker.x = tile.x + newPoints[3].x;
        exitMarker.z = tile.y + newPoints[3].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
        markers.push(new THREE.Vector3(tile.x - 0.5 + pwidth / 2, 0.05, tile.y + 0.5));
        markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y + 0.5));
      } else if (prevTile.x < tile.x && nextTile.y < tile.y) {
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        entranceMarker.x = tile.x + points[points.length - 1].x;
        entranceMarker.z = tile.y + points[points.length - 1].z;
        exitMarker.x = tile.x + points[0].x;
        exitMarker.z = tile.y + points[0].z;
        markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      } else if (prevTile.y > tile.y && nextTile.x < tile.x) {
        angle = (Math.PI / 2) * 1;
        entranceMarker.x = tile.x - 0.5 + pwidth / 2;
        entranceMarker.z = tile.y + 0.5;

        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        let newPoints = [];
        for (let i = points.length - 1; i >= 0; i--) {
          const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
          vector.applyAxisAngle(axis, angle);
          newPoints.push(vector);
        }
        exitMarker.x = tile.x + newPoints[3].x;
        exitMarker.z = tile.y + newPoints[3].z;
        markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      } else if (prevTile.x < tile.x && nextTile.y > tile.y) {
        let points = calculateCurveVertices(pwidth / 2, 2); // 5
        entranceMarker.x = tile.x + points[points.length - 1].x;
        entranceMarker.z = tile.y + points[points.length - 1].z;
        exitMarker.x = tile.x + 0.5 - pwidth / 2;
        exitMarker.z = tile.y + 0.5;
        markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
        markers.push(new THREE.Vector3(tile.x + points[0].x, 0.05, tile.y + points[0].z));
        markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y - 0.5));
      }
    }

    return { entranceMarker, exitMarker, markers };
  }

  getMarkersForFourWayType(rotation, isStart, isEnd, tile, nextTile, prevTile, type) {
    let entranceMarker = new THREE.Vector3(0, 0.05, 0);
    let exitMarker = new THREE.Vector3(0, 0.05, 0);
    let markers = [];
    const axis = new THREE.Vector3(0, 1, 0);
    let angle = undefined;

    let pwidth =
      type === 'person' ? (1 - tile.road.width) / 2 : tile.road.width + (1 - tile.road.width) / 2;
    // let pwidth = (1 - tile.road.width) /2;

    if (prevTile.x < tile.x && nextTile.y > tile.y) {
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      entranceMarker.x = tile.x + points[points.length - 1].x;
      entranceMarker.z = tile.y + points[points.length - 1].z;
      exitMarker.x = tile.x + 0.5 - pwidth / 2;
      exitMarker.z = tile.y + 0.5;
      markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      markers.push(new THREE.Vector3(tile.x + points[0].x, 0.05, tile.y + points[0].z));
      markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y - 0.5));
      angle = (Math.PI / 2) * 3;
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y - 0.5));
      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      markers.push(new THREE.Vector3(tile.x + 0.5, 0.05, tile.y - 0.5 + pwidth / 2));

      markers.push(new THREE.Vector3(tile.x + 0.5, 0.05, tile.y + 0.5 - pwidth / 2));
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      newPoints = [];
      angle = (Math.PI / 2) * 2;
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
    } else if (prevTile.x < tile.x && nextTile.y < tile.y) {
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      entranceMarker.x = tile.x + points[points.length - 1].x;
      entranceMarker.z = tile.y + points[points.length - 1].z;
      exitMarker.x = tile.x + points[0].x;
      exitMarker.z = tile.y + points[0].z;
      markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
    } else if (prevTile.x > tile.x && nextTile.y > tile.y) {
      entranceMarker.x = tile.x + 0.5;
      entranceMarker.z = tile.y + 0.5 - pwidth / 2;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      angle = (Math.PI / 2) * 2;
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      exitMarker.x = tile.x + 0.5 - pwidth / 2;
      exitMarker.z = tile.y + 0.5;
    } else if (prevTile.x > tile.x && nextTile.y < tile.y) {
      entranceMarker.x = tile.x + 0.5;
      entranceMarker.z = tile.y + 0.5 - pwidth / 2;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      angle = (Math.PI / 2) * 2;
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      markers.push(
        new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, (exitMarker.z = tile.y + 0.5)),
      );
      angle = (Math.PI / 2) * 1;
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      newPoints = [];
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }

      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      markers.push(new THREE.Vector3(tile.x + newPoints[3].x, 0.05, tile.y + newPoints[3].z));
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      markers.push(
        new THREE.Vector3(
          tile.x + points[points.length - 1].x,
          0.05,
          tile.y + points[points.length - 1].z,
        ),
      );
      exitMarker.x = tile.x + points[0].x;
      exitMarker.z = tile.y + points[0].z;
      markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
    } else if (prevTile.y > tile.y && nextTile.x > tile.x) {
      angle = (Math.PI / 2) * 1;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }

      entranceMarker.x = tile.x + newPoints[1].x;
      entranceMarker.z = tile.y + newPoints[1].z;
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      markers.push(new THREE.Vector3(tile.x + newPoints[3].x, 0.05, tile.y + newPoints[3].z));
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      markers.push(
        new THREE.Vector3(
          tile.x + points[points.length - 1].x,
          0.05,
          tile.y + points[points.length - 1].z,
        ),
      );

      markers.push(new THREE.Vector3(tile.x + points[1].x, 0.05, tile.y + points[1].z));
      markers.push(new THREE.Vector3(tile.x + points[0].x, 0.05, tile.y + points[0].z));
      angle = (Math.PI / 2) * 3;
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y - 0.5));
      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      exitMarker.x = tile.x + 0.5;
      exitMarker.z = tile.y - 0.5 + pwidth / 2;
    } else if (prevTile.y > tile.y && nextTile.x < tile.x) {
      angle = (Math.PI / 2) * 1;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }

      entranceMarker.x = tile.x + newPoints[1].x;
      entranceMarker.z = tile.y + newPoints[1].z;
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      exitMarker.x = tile.x + newPoints[3].x;
      exitMarker.z = tile.y + newPoints[3].z;
    } else if (prevTile.y < tile.y && nextTile.x > tile.x) {
      angle = (Math.PI / 2) * 3;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      entranceMarker.x = tile.x + 0.5 - pwidth / 2;
      entranceMarker.z = tile.y - 0.5;
      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      exitMarker.x = tile.x + 0.5;
      exitMarker.z = tile.y - 0.5 + pwidth / 2;
    } else if (prevTile.y < tile.y && nextTile.x < tile.x) {
      angle = (Math.PI / 2) * 3;
      let points = calculateCurveVertices(pwidth / 2, 2); // 5
      let newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      entranceMarker.x = tile.x + 0.5 - pwidth / 2;
      entranceMarker.z = tile.y - 0.5;
      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      markers.push(new THREE.Vector3(tile.x + 0.5, 0.05, tile.y - 0.5 + pwidth / 2));
      markers.push(new THREE.Vector3(tile.x + 0.5, 0.05, tile.y + 0.5 - pwidth / 2));
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      newPoints = [];
      angle = (Math.PI / 2) * 2;
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
      markers.push(new THREE.Vector3(tile.x + 0.5 - pwidth / 2, 0.05, tile.y + 0.5));

      angle = (Math.PI / 2) * 1;
      points = calculateCurveVertices(pwidth / 2, 2); // 5
      newPoints = [];
      for (let i = points.length - 1; i >= 0; i--) {
        const vector = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        vector.applyAxisAngle(axis, angle);
        newPoints.push(vector);
      }
      exitMarker.x = tile.x + newPoints[3].x;
      exitMarker.z = tile.y + newPoints[3].z;
      markers.push(new THREE.Vector3(tile.x + newPoints[1].x, 0.05, tile.y + newPoints[1].z));
      markers.push(new THREE.Vector3(tile.x + newPoints[2].x, 0.05, tile.y + newPoints[2].z));
    } else if (prevTile.x < tile.x && nextTile.y === tile.y) {
      entranceMarker.x = tile.x - 0.5;
      entranceMarker.z = tile.y - 0.5 + pwidth / 2;
      exitMarker.x = tile.x + 0.5;
      exitMarker.z = tile.y - 0.5 + pwidth / 2;
    } else if (prevTile.x > tile.x && nextTile.y === tile.y) {
      entranceMarker.x = tile.x + 0.5;
      entranceMarker.z = tile.y + 0.5 - pwidth / 2;
      exitMarker.x = tile.x - 0.5;
      exitMarker.z = tile.y + 0.5 - pwidth / 2;
    } else if (prevTile.y < tile.y && nextTile.x === tile.x) {
      entranceMarker.x = tile.x + 0.5 - pwidth / 2;
      entranceMarker.z = tile.y - 0.5;
      exitMarker.x = tile.x + 0.5 - pwidth / 2;
      exitMarker.z = tile.y + 0.5;
    } else if (prevTile.y > tile.y && nextTile.x === tile.x) {
      entranceMarker.x = tile.x - 0.5 + pwidth / 2;
      entranceMarker.z = tile.y + 0.5;
      exitMarker.x = tile.x - 0.5 + pwidth / 2;
      exitMarker.z = tile.y - 0.5;
    }

    return { entranceMarker, exitMarker, markers };
  }
}
