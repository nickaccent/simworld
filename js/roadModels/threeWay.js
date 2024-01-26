import * as THREE from 'three';
import { calculateCurveVertices } from './helpers.js';

export const createThreeWay = (road, width, kerbHeight, x, y, colorBed, colorKerb, orientation) => {
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
    0 - width / 2,
    xmin,
    hmin,
    0 - width / 2,
    xmax,
    hmin,
    0 + width / 2,

    xmax,
     hmin,
    0 + width / 2,
    xmin,
    hmin,
    0 - width / 2,
    xmin,
    hmin,
    0 + width / 2,

    xmax - width / 2,
    hmin,
    0 + width / 2,
    xmin + width / 2,
    hmin,
    0 + width / 2,
    xmax - width / 2,
    hmin,
    ymax,

    xmax - width / 2,
    hmin,
    ymax,
    xmin + width / 2,
    hmin,
    0 + width / 2,
    xmin + width / 2,
    hmin,
    ymax,
    
    xmax - width / 2,
    hmin,
    0 + width / 2,
    xmax - width / 2,
    hmin,
    ymax,
    xmax - pwidth,
    hmin,
    ymax,

    xmin + width / 2,
    hmin,
    0 + width / 2,
    xmin + pwidth,
    hmin,
    ymax,
    xmin + width / 2,
    hmin,
    ymax,
  ];

  let bedRightInnerPoints = calculateCurveVertices(width / 6, 5);

  
  for (let i = 0; i < bedRightInnerPoints.length; i++) {
    bedRightInnerPoints[i].z = Math.abs(bedRightInnerPoints[i].z);
  }

  let bedLeftInnerPoints = [];
  for (let i = 0; i < bedRightInnerPoints.length; i++) {
    bedLeftInnerPoints.push(
      new THREE.Vector3(
        Math.abs(bedRightInnerPoints[i].x),
        bedRightInnerPoints[i].y,
        bedRightInnerPoints[i].z,
      ),
    );
  }

  function createRightBedCurve(points) {
    for (let i = points.length - 1; i > 0; i--) {
      bed.push(xmin + width / 2, hmin, 0+ width / 2);
      bed.push(points[i].x, hmin, points[i].z);
      bed.push(points[i - 1].x, hmin, points[i - 1].z);
    }
  }
  createRightBedCurve(bedRightInnerPoints);

  function createLeftBedCurve(points) {
    for (let i = 0; i < points.length - 1; i++) {
      bed.push(xmax - width / 2, hmin, 0 + width / 2);
      bed.push(points[i].x, hmin, points[i].z);
      bed.push(points[i + 1].x, hmin, points[i + 1].z);
    }
  }
  createLeftBedCurve(bedLeftInnerPoints);

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
  addKerbLeftRoad(bedLeftInnerPoints);

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
  addKerbRightRoad(bedRightInnerPoints);

  function addKerbLeftTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(0.5, hmax, 0.5);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
      kerb.push(points[i].x, hmax, points[i].z);
    }
  }

  addKerbLeftTop(bedLeftInnerPoints);

  function addKerbRightTop(points) {
    for (var i = 0; i < points.length - 1; i++) {
      kerb.push(-0.5, hmax, 0.5);
      kerb.push(points[i].x, hmax, points[i].z);
      kerb.push(points[i + 1].x, hmax, points[i + 1].z);
    }
  }

  addKerbRightTop(bedRightInnerPoints);

  // Kerb Front Top
  kerb.push(xmax, hmax, ymin);
  kerb.push(xmin, hmax, ymin);
  kerb.push(xmax, hmax, 0 - (width / 2));
  kerb.push(xmax, hmax, 0 - (width / 2));
  kerb.push(xmin, hmax, ymin);
  kerb.push(xmin, hmax, 0 - (width / 2));

  // Kerb Back Up
  kerb.push(xmin, hmin, 0 - width / 2);
  kerb.push(xmax, hmin, 0 - width / 2);
  kerb.push(xmin, hmax, 0 -  width / 2);
  kerb.push(xmin, hmax, 0 - width / 2);
  kerb.push(xmax, hmin, 0 - width / 2);
  kerb.push(xmax, hmax, 0 - width / 2);

  // Kerb Back Lip
  kerb.push(xmax, hmin, ymin);
  kerb.push(xmin, hmin, ymin);
  kerb.push(xmax, hmax, ymin);
  kerb.push(xmax, hmax, ymin);
  kerb.push(xmin, hmin, ymin);
  kerb.push(xmin, hmax, ymin);
  //1, -1, -1,
  // -1, -1, -1,
  // 1, 1, -1,
  // 1, 1, -1,
  // -1, -1, -1,
  // -1, 1, -1,
  const bedColor = [];
  for (let i = 0; i < 54; i++) {
    bedColor.push(...colorBed);
  }

  const kerbColor = [];
  for (let i = 0; i < 126; i++) {
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

  if (orientation === 'up-down-right') {
    bedGeom.rotateY((Math.PI / 2) * 3);
    kerbGeom.rotateY((Math.PI / 2) * 3);
  }

  if (orientation === 'left-right-down') {
    bedGeom.rotateY((Math.PI / 2) * 2);
    kerbGeom.rotateY((Math.PI / 2) * 2);
  }

  if (orientation === 'up-down-left') {
    bedGeom.rotateY((Math.PI / 2) * 1);
    kerbGeom.rotateY((Math.PI / 2) * 1);
  }

  bedGeom.translate(roadx, 0, roady);
  kerbGeom.translate(roadx, 0, roady);

  return {
    bed: bedGeom,
    kerb: kerbGeom,
  };
};
