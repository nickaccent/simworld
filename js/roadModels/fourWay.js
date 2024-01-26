import * as THREE from 'three';
import { calculateCurveVertices } from './helpers.js';

export const createFourWay = (road, width, kerbHeight, x, y, colorBed, colorKerb) => {
  let roadx = x;
  let roady = y;
  let xmin = -0.5;
  let xmax = +0.5;

  let ymin = -0.5;
  let ymax = +0.5;

  let hmin = 0;
  let hmax = kerbHeight;

  let bed = [];
  let kerb = [];

  
  let pwidth = (1 - width) /2;

  bed = [
    xmax,
    hmin,
    ymin + pwidth,
    xmin,
    hmin,
    ymin + pwidth,
    xmax,
    hmin,
    ymax - pwidth,

    xmax,
    hmin,
    ymax - pwidth,
    xmin,
    hmin,
    ymin + pwidth,
    xmin,
    hmin,
    ymax - pwidth,

    xmax - width / 2,
    hmin,
    ymax - pwidth,
    xmin + width / 2,
    hmin,
    ymax - pwidth,
    xmax - width / 2,
    hmin,
    ymax,

    xmin + width / 2,
    hmin,
    ymax - pwidth,
    xmin + pwidth,
    hmin,
    ymax,
    xmin + width / 2,
    hmin,
    ymax,

    xmax - width / 2,
    hmin,
    ymax,
    xmin + width / 2,
    hmin,
    ymax - pwidth,
    xmin + width / 2,
    hmin,
    ymax,

    xmax - pwidth,
    hmin,
    ymax,
    xmax - width / 2,
    hmin,
    ymax - pwidth,
    xmax - width / 2,
    hmin,
    ymax,

    xmax - width / 2,
    hmin,
    ymin,
    xmin + width / 2,
    hmin,
    ymin,
    xmax - width / 2,
    hmin,
    ymin + pwidth,

    xmin + width / 2,
    hmin,
    ymin,
    xmin + pwidth,
    hmin,
    ymin,
    xmin + width / 2,
    hmin,
    ymin + pwidth,

    xmax - width / 2,
    hmin,
    ymin + pwidth,
    xmin + width / 2,
    hmin,
    ymin,
    xmin + width / 2,
    hmin,
    ymin + pwidth,

    xmax - pwidth,
    hmin,
    ymin,
    xmax - width / 2,
    hmin,
    ymin,
    xmax - width / 2,
    hmin,
    ymin + pwidth,
  ];
  let bedRightLowerPoints = calculateCurveVertices(width / 6, 5);
  let bedRightUpperPoints = calculateCurveVertices(width / 6, 5);
  for (let i = 0; i < bedRightUpperPoints.length; i++) {
    bedRightUpperPoints[i].z = Math.abs(bedRightUpperPoints[i].z);
  }

  let bedLeftUpperPoints = [];
  for (let i = 0; i < bedRightUpperPoints.length; i++) {
    bedLeftUpperPoints.push(
      new THREE.Vector3(
        Math.abs(bedRightUpperPoints[i].x),
        bedRightUpperPoints[i].y,
        bedRightUpperPoints[i].z,
      ),
    );
  }

  let bedLeftLowerPoints = [];
  for (let i = 0; i < bedRightLowerPoints.length; i++) {
    bedLeftLowerPoints.push(
      new THREE.Vector3(
        Math.abs(bedRightLowerPoints[i].x),
        bedRightLowerPoints[i].y,
        bedRightLowerPoints[i].z,
      ),
    );
  }

  function createRightBedCurve(points) {
    for (let i = points.length - 1; i > 0; i--) {
      bed.push(xmin + width / 2, hmin, ymax - pwidth);
      bed.push(points[i].x, hmin, points[i].z);
      bed.push(points[i - 1].x, hmin, points[i - 1].z);
    }
  }
  createRightBedCurve(bedRightUpperPoints);

  function createLeftBedCurve(points) {
    for (let i = 0; i < points.length - 1; i++) {
      bed.push(xmax - width / 2, hmin,  ymax - pwidth);
      bed.push(points[i].x, hmin, points[i].z);
      bed.push(points[i + 1].x, hmin, points[i + 1].z);
    }
  }
  createLeftBedCurve(bedLeftUpperPoints);

  function addKerbLeftRoad(innerPoints) {
    for (var i = 0; i < innerPoints.length - 1; i++) {
      let innerPoint = innerPoints[i];
      let innerPoint2 = innerPoints[i + 1];

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
      kerb.push(innerPoint2.x, hmin, innerPoint2.z);

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint.x, hmax, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
    }
  }
  addKerbLeftRoad(bedLeftUpperPoints);

  function addKerbRightRoad(innerPoints) {
    for (var i = innerPoints.length - 1; i > 0; i--) {
      let innerPoint = innerPoints[i];
      let innerPoint2 = innerPoints[i - 1];

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
      kerb.push(innerPoint2.x, hmin, innerPoint2.z);

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint.x, hmax, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
    }
  }
  addKerbRightRoad(bedRightUpperPoints);

  function addKerbLeftTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(0.5, hmax, 0.5);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
      kerb.push(points[i].x, hmax, points[i].z);
    }
  }

  addKerbLeftTop(bedLeftUpperPoints);

  function addKerbRightTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(-0.5, hmax, 0.5);
      kerb.push(points[i].x, hmax, points[i].z);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
    }
  }

  addKerbRightTop(bedRightUpperPoints);

  function createRightBedLowerCurve(points) {
    for (let i = points.length - 1; i > 0; i--) {
      bed.push(xmin + width / 2, hmin, ymin + pwidth);
      bed.push(points[i - 1].x, hmin, points[i - 1].z);
      bed.push(points[i].x, hmin, points[i].z);
    }
  }
  createRightBedLowerCurve(bedRightLowerPoints);

  function createLeftLowerBedCurve(points) {
    for (let i = 0; i < points.length - 1; i++) {
      bed.push(xmax - width / 2, hmin, ymin + pwidth );
      bed.push(points[i + 1].x, hmin, points[i + 1].z);
      bed.push(points[i].x, hmin, points[i].z);
    }
  }
  createLeftLowerBedCurve(bedLeftLowerPoints);

  function addKerbLeftLowerRoad(innerPoints) {
    for (var i = 0; i < innerPoints.length - 1; i++) {
      let innerPoint = innerPoints[i];
      let innerPoint2 = innerPoints[i + 1];

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmin, innerPoint2.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
      kerb.push(innerPoint.x, hmax, innerPoint.z);
    }
  }
  addKerbLeftLowerRoad(bedLeftLowerPoints);

  function addKerbRightLowerRoad(innerPoints) {
    for (var i = innerPoints.length - 1; i > 0; i--) {
      let innerPoint = innerPoints[i];
      let innerPoint2 = innerPoints[i - 1];

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmin, innerPoint2.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);

      kerb.push(innerPoint.x, hmin, innerPoint.z);
      kerb.push(innerPoint2.x, hmax, innerPoint2.z);
      kerb.push(innerPoint.x, hmax, innerPoint.z);
    }
  }
  addKerbRightLowerRoad(bedRightLowerPoints);

  function addKerbLeftLowerTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(0.5, hmax, -0.5);
      kerb.push(points[i].x, hmax, points[i].z);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
    }
  }

  addKerbLeftLowerTop(bedLeftLowerPoints);

  function addKerbRightLowerTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(-0.5, hmax, -0.5);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
      kerb.push(points[i].x, hmax, points[i].z);
    }
  }

  addKerbRightLowerTop(bedRightLowerPoints);

  const bedColor = [];
  for (let i = 0; i < 102; i++) {
    bedColor.push(...colorBed);
  }

  const kerbColor = [];
  for (let i = 0; i < 216; i++) {
    kerbColor.push(...colorKerb);
  }

  let bedGeom = new THREE.BufferGeometry();
  let verts = new Float32Array(bed);
  let colors = new Uint8Array(bedColor);
  bedGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  bedGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
  bedGeom.name = 'curved';
  bedGeom.userData = road;

  let kerbGeom = new THREE.BufferGeometry();
  let kerbVerts = new Float32Array(kerb);
  let kerbColors = new Uint8Array(kerbColor);
  kerbGeom.setAttribute('position', new THREE.BufferAttribute(kerbVerts, 3));
  kerbGeom.setAttribute('color', new THREE.BufferAttribute(kerbColors, 3, true));
  kerbGeom.name = 'curved';
  kerbGeom.userData = road;

  bedGeom.computeVertexNormals();
  bedGeom.normalizeNormals();
  kerbGeom.computeVertexNormals();
  kerbGeom.normalizeNormals();

  bedGeom.translate(roadx, 0, roady);
  kerbGeom.translate(roadx, 0, roady);

  return {
    bed: bedGeom,
    kerb: kerbGeom,
  };
};
