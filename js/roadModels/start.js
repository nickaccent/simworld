import * as THREE from 'three';

export const createStart = (road, width, kerbHeight, x, y, colorBed, colorKerb) => {
  let xmin = x - 0.5;
  let xmax = x + 0.5;

  let ymin = y - 0.5;
  let ymax = y + 0.5;

  let hmin = 0;
  let hlip = 0.025;
  let hmax = kerbHeight;

  const bed = [
    //   // top
    // +W 0 -L
    x + width / 2,
    hmin,
    y - width / 2,
    // -W 0 -L
    x - width / 2,
    hmin,
    y - width / 2,
    // +W 0 +L
    x + width / 2,
    hmin,
    y + width / 2,

    // +W 0 +L
    x + width / 2,
    hmin,
    y + width / 2,
    // -W 0 -L
    x - width / 2,
    hmin,
    y - width / 2,
    // -W 0 +:
    x - width / 2,
    hmin,
    y + width / 2,
  ];

  const kerb = [
    // kerb Up Front
    x - width / 2,
    hmin,
    y - width / 2,
    x + width / 2,
    hmin,
    y - width / 2,
    x - width / 2,
    hmax,
    y - width / 2,
    x - width / 2,
    hmax,
    y - width / 2,
    x + width / 2,
    hmin,
    y - width / 2,
    x + width / 2,
    hmax,
    y - width / 2,

    // Kerb Up Back
    x + width / 2,
    hmin,
    y + width / 2,
    x - width / 2,
    hmin,
    y + width / 2,
    x + width / 2,
    hmax,
    y + width / 2,
    x + width / 2,
    hmax,
    y + width / 2,
    x - width / 2,
    hmin,
    y + width / 2,
    x - width / 2,
    hmax,
    y + width / 2,

    // lip front
    xmax,
    hmin,
    ymin,
    xmin,
    hmin,
    ymin,
    xmax,
    hmax,
    ymin,
    xmax,
    hmax,
    ymin,
    xmin,
    hmin,
    ymin,
    xmin,
    hmax,
    ymin,

    // lip back
    xmin,
    hmin,
    ymax,
    xmax,
    hmin,
    ymax,
    xmin,
    hmax,
    ymax,
    xmin,
    hmax,
    ymax,
    xmax,
    hmin,
    ymax,
    xmax,
    hmax,
    ymax,

    // Kerb Top Front
    x + width / 2,
    hmax,
    ymin,
    x - width / 2,
    hmax,
    ymin,
    x + width / 2,
    hmax,
    y - width / 2,
    x + width / 2,
    hmax,
    y - width / 2,
    x - width / 2,
    hmax,
    ymin,
    x - width / 2,
    hmax,
    y - width / 2,

    // Kerb Top Back
    x + width / 2,
    hmax,
    y + width / 2,
    x - width / 2,
    hmax,
    y + width / 2,
    x + width / 2,
    hmax,
    ymax,
    x + width / 2,
    hmax,
    ymax,
    x - width / 2,
    hmax,
    y + width / 2,
    x - width / 2,
    hmax,
    ymax,

    // Kerb Up Right
    x + width / 2,
    hmin,
    y - width / 2,
    x + width / 2,
    hmin,
    y + width / 2,
    x + width / 2,
    hmax,
    y - width / 2,
    x + width / 2,
    hmax,
    y - width / 2,
    x + width / 2,
    hmin,
    y + width / 2,
    x + width / 2,
    hmax,
    y + width / 2,

    // Kerb Up Left
    x - width / 2,
    hmin,
    y + width / 2,
    x - width / 2,
    hmin,
    y - width / 2,
    x - width / 2,
    hmax,
    y + width / 2,
    x - width / 2,
    hmax,
    y + width / 2,
    x - width / 2,
    hmin,
    y - width / 2,
    x - width / 2,
    hmax,
    y - width / 2,

    // Kerb Lip L
    xmin,
    hmin,
    ymin,
    xmin,
    hmin,
    ymax,
    xmin,
    hmax,
    ymin,
    xmin,
    hmax,
    ymin,
    xmin,
    hmin,
    ymax,
    xmin,
    hmax,
    ymax,

    // Kerb Lip R
    xmax,
    hmin,
    ymax,
    xmax,
    hmin,
    ymin,
    xmax,
    hmax,
    ymax,
    xmax,
    hmax,
    ymax,
    xmax,
    hmin,
    ymin,
    xmax,
    hmax,
    ymin,

    // Kerb Top R
    x - width / 2,
    hmax,
    ymin,
    xmin,
    hmax,
    ymin,
    x - width / 2,
    hmax,
    ymax,
    x - width / 2,
    hmax,
    ymax,
    xmin,
    hmax,
    ymin,
    xmin,
    hmax,
    ymax,

    // Kerb Top L
    xmax,
    hmax,
    ymin,
    x + width / 2,
    hmax,
    ymin,
    xmax,
    hmax,
    ymax,
    xmax,
    hmax,
    ymax,
    x + width / 2,
    hmax,
    ymin,
    x + width / 2,
    hmax,
    ymax,
  ];

  const bedColor = [];
  for (let i = 0; i < 6; i++) {
    bedColor.push(...colorBed);
  }

  const kerbColor = [];
  for (let i = 0; i < 108; i++) {
    kerbColor.push(...colorKerb);
  }

  let bedGeom = new THREE.BufferGeometry();
  let verts = new Float32Array(bed);
  let colors = new Uint8Array(bedColor);
  bedGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  bedGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
  bedGeom.name = 'start';
  bedGeom.userData = road;
  bedGeom.computeVertexNormals();
  bedGeom.normalizeNormals();

  let kerbGeom = new THREE.BufferGeometry();
  let kerbVerts = new Float32Array(kerb);
  let kerbColors = new Uint8Array(kerbColor);
  kerbGeom.setAttribute('position', new THREE.BufferAttribute(kerbVerts, 3));
  kerbGeom.setAttribute('color', new THREE.BufferAttribute(kerbColors, 3, true));
  kerbGeom.name = 'start';
  kerbGeom.userData = road;
  kerbGeom.computeVertexNormals();
  kerbGeom.normalizeNormals();

  return {
    bed: bedGeom,
    kerb: kerbGeom,
  };
};
