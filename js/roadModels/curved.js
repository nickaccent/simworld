import * as THREE from 'three';
import { calculateCurveVertices } from './helpers.js';

export const createCurved = (road, width, kerbHeight, x, y, colorBed, colorKerb, orientation) => {
  // default orientation is up-right

  let roadx = x;
  let roady = y;
  x = 0;
  y = 0;

  let length = 1;
  let xmin = x - 0.5;
  let xmax = x + 0.5;

  let ymin = y - 0.5;
  let ymax = y + 0.5;

  let hmin = 0;
  let hlip = 0;
  let hmax = kerbHeight;

  let bed = [];
  let kerb = [];

  function verticesForConnectPoints(innerPoints, outerPoints) {
    let bedverts = [];
    for (var i = 0; i < innerPoints.length - 2; i++) {
      let outeroffset = i * 2;

      let innerPoint = innerPoints[i];
      let innerPoint2 = innerPoints[i + 1];
      let outerPoint = outerPoints[outeroffset];
      let outerPoint2 = outerPoints[outeroffset + 1];
      let outerPoint3 = outerPoints[outeroffset + 2];

      bedverts.push(outerPoint2.x, 0, outerPoint2.z);
      bedverts.push(outerPoint.x, 0, outerPoint.z);
      bedverts.push(innerPoint.x, 0, innerPoint.z);

      bedverts.push(outerPoint2.x, 0, outerPoint2.z);
      bedverts.push(innerPoint.x, 0, innerPoint.z);
      bedverts.push(innerPoint2.x, 0, innerPoint2.z);

      bedverts.push(outerPoint2.x, 0, outerPoint2.z);
      bedverts.push(innerPoint2.x, 0, innerPoint2.z);
      bedverts.push(outerPoint3.x, 0, outerPoint3.z);
    }
    return bedverts;
  }

  function addKerbOuterRoad(outerPoints) {
    for (var i = 0; i < outerPoints.length - 1; i++) {
      let outerPoint = outerPoints[i];
      let outerPoint2 = outerPoints[i + 1];

      kerb.push(outerPoint.x, hmin, outerPoint.z);
      kerb.push(outerPoint2.x, hmin, outerPoint2.z);
      kerb.push(outerPoint2.x, hmax, outerPoint2.z);

      kerb.push(outerPoint2.x, hmax, outerPoint2.z);
      kerb.push(outerPoint.x, hmax, outerPoint.z);
      kerb.push(outerPoint.x, hmin, outerPoint.z);
    }
  }

  function addKerbInnerRoad(innerPoints) {
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

  function addKerbInnerTop(bedInnerPoints, kerbInnerPoints) {
    for (var i = 0; i < kerbInnerPoints.length - 4; i++) {
      let outeroffset = i * 2;
      let outerPoint = bedInnerPoints[outeroffset];
      let outerPoint2 = bedInnerPoints[outeroffset + 1];
      let outerPoint3 = bedInnerPoints[outeroffset + 2];
      kerb.push(outerPoint.x, hmax, outerPoint.z);
      kerb.push(x - 0.5, hmax, y - 0.5);
      kerb.push(outerPoint2.x, hmax, outerPoint2.z);

      kerb.push(outerPoint2.x, hmax, outerPoint2.z);
      kerb.push(x - 0.5, hmax, y - 0.5);
      kerb.push(outerPoint3.x, hmax, outerPoint3.z);
    }
  }

  function addKerbOuterTop(bedOuterPoints) {
    kerb.push(x + 0.5, hmax, y + 0.5);
    kerb.push(x + 0.5, hmax, y - 0.5);
    kerb.push(bedOuterPoints[0].x, hmax, y - 0.5);

    for (var i = 0; i < bedOuterPoints.length - 1; i++) {
      let outerPoint = bedOuterPoints[i];
      let outerPoint2 = bedOuterPoints[i + 1];
      kerb.push(x + 0.5, hmax, y + 0.5);
      kerb.push(outerPoint.x, hmax, outerPoint.z);
      kerb.push(outerPoint2.x, hmax, outerPoint2.z);
    }

    kerb.push(x + 0.5, hmax, y + 0.5);
    kerb.push(
      bedOuterPoints[bedOuterPoints.length - 1].x,
      hmax,
      bedOuterPoints[bedOuterPoints.length - 1].z,
    );
    kerb.push(x - 0.5, hmax, y + 0.5);
  }

  let bedInnerPoints = calculateCurveVertices(width / 6, 5); // 5
  let bedOuterPoints = calculateCurveVertices(width + width/6, 10); // 10
  let kerbInnerPoints = calculateCurveVertices(width / 6, 5); // 5
  bed = verticesForConnectPoints(bedInnerPoints, bedOuterPoints);

  addKerbOuterRoad(bedOuterPoints);
  addKerbInnerRoad(bedInnerPoints);
  addKerbInnerTop(bedInnerPoints, kerbInnerPoints);
  addKerbOuterTop(bedOuterPoints);

  kerb.push(
    // lip L
    xmin,
    hlip,
    ymax,
    xmax,
    hlip,
    ymax,
    xmin,
    hmax,
    ymax,
    xmin,
    hmax,
    ymax,
    xmax,
    hlip,
    ymax,
    xmax,
    hmax,
    ymax,
  );

  kerb.push(
    // left
    xmax,
    hlip,
    y + length / 2,
    xmax,
    hlip,
    y - length / 2,
    xmax,
    hmax,
    y + length / 2,
    xmax,
    hmax,
    y + length / 2,
    xmax,
    hlip,
    y - length / 2,
    xmax,
    hmax,
    y - length / 2,
  );

  const bedColor = [];
  for (let i = 0; i < 45; i++) {
    bedColor.push(...colorBed);
  }

  const kerbColor = [];
  for (let i = 0; i < 171; i++) {
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

  if (orientation === 'up-left') {
    bedGeom.rotateY((Math.PI / 2) * 3);
    kerbGeom.rotateY((Math.PI / 2) * 3);
  }

  if (orientation === 'down-right') {
    bedGeom.rotateY((Math.PI / 2) * 1);
    kerbGeom.rotateY((Math.PI / 2) * 1);
  }

  if (orientation === 'down-left') {
    bedGeom.rotateY((Math.PI / 2) * 2);
    kerbGeom.rotateY((Math.PI / 2) * 2);
  }

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
