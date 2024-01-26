import * as THREE from 'three';

export const createStraight = (road, width, kerbHeight, x, y, colorBed, colorKerb, orienation) => {
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
  if (orienation === 'north' || orienation === 'south') {
    bed = [
      //   // top
      // +W 0 -L
      x + width / 2,
      hmin,
      y - length / 2,
      // -W 0 -L
      x - width / 2,
      hmin,
      y - length / 2,
      // +W 0 +L
      x + width / 2,
      hmin,
      y + length / 2,

      // +W 0 +L
      x + width / 2,
      hmin,
      y + length / 2,
      // -W 0 -L
      x - width / 2,
      hmin,
      y - length / 2,
      // -W 0 +:
      x - width / 2,
      hmin,
      y + length / 2,
    ];

    kerb = [
      // right
      xmin,
      hlip,
      y - length / 2,
      xmin,
      hlip,
      y + length / 2,
      xmin,
      hmax,
      y - length / 2,
      xmin,
      hmax,
      y - length / 2,
      xmin,
      hlip,
      y + length / 2,
      xmin,
      hmax,
      y + length / 2,
      // left
      x - width / 2,
      hmin,
      y + length / 2,
      x - width / 2,
      hmin,
      y - length / 2,
      x - width / 2,
      hmax,
      y + length / 2,
      x - width / 2,
      hmax,
      y + length / 2,
      x - width / 2,
      hmin,
      y - length / 2,
      x - width / 2,
      hmax,
      y - length / 2,
      // top
      x - width / 2,
      hmax,
      y - length / 2,
      xmin,
      hmax,
      y - length / 2,
      x - width / 2,
      hmax,
      y + length / 2,
      x - width / 2,
      hmax,
      y + length / 2,
      xmin,
      hmax,
      y - length / 2,
      xmin,
      hmax,
      y + length / 2,
      // right
      x + width / 2,
      hmin,
      y - length / 2,
      x + width / 2,
      hmin,
      y + length / 2,
      x + width / 2,
      hmax,
      y - length / 2,
      x + width / 2,
      hmax,
      y - length / 2,
      x + width / 2,
      hmin,
      y + length / 2,
      x + width / 2,
      hmax,
      y + length / 2,
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
      // top
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
  } else {
    let width2 = length;
    length = width;
    width = width2;
    bed = [
      //   // top
      // +W 0 -L
      x + width / 2,
      hmin,
      y - length / 2,
      // -W 0 -L
      x - width / 2,
      hmin,
      y - length / 2,
      // +W 0 +L
      x + width / 2,
      hmin,
      y + length / 2,

      // +W 0 +L
      x + width / 2,
      hmin,
      y + length / 2,
      // -W 0 -L
      x - width / 2,
      hmin,
      y - length / 2,
      // -W 0 +:
      x - width / 2,
      hmin,
      y + length / 2,
    ];

    kerb = [
      // Kerb Up R
      xmin,
      hmin,
      y - length / 2,
      xmax,
      hmin,
      y - length / 2,
      xmin,
      hmax,
      y - length / 2,
      xmin,
      hmax,
      y - length / 2,
      xmax,
      hmin,
      y - length / 2,
      xmax,
      hmax,
      y - length / 2,

      // Lip R
      xmax,
      hlip,
      ymin,
      xmin,
      hlip,
      ymin,
      xmax,
      hmax,
      ymin,
      xmax,
      hmax,
      ymin,
      xmin,
      hlip,
      ymin,
      xmin,
      hmax,
      ymin,

      // Kerb R Top
      xmax,
      hmax,
      ymin,
      xmin,
      hmax,
      ymin,
      xmax,
      hmax,
      y - length / 2,
      xmax,
      hmax,
      y - length / 2,
      xmin,
      hmax,
      ymin,
      xmin,
      hmax,
      y - length / 2,

      // Kerb Up L
      xmax,
      hmin,
      y + length / 2,
      xmin,
      hmin,
      y + length / 2,
      xmax,
      hmax,
      y + length / 2,
      xmax,
      hmax,
      y + length / 2,
      xmin,
      hmin,
      y + length / 2,
      xmin,
      hmax,
      y + length / 2,

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

      // Kerb L Top
      xmax,
      hmax,
      y + length / 2,
      xmin,
      hmax,
      y + length / 2,
      xmax,
      hmax,
      ymax,
      xmax,
      hmax,
      ymax,
      xmin,
      hmax,
      y + length / 2,
      xmin,
      hmax,
      ymax,
    ];
  }

  const bedColor = [];
  for (let i = 0; i < 6; i++) {
    bedColor.push(...colorBed);
  }

  const kerbColor = [];
  for (let i = 0; i < 116; i++) {
    kerbColor.push(...colorKerb);
  }

  let bedGeom = new THREE.BufferGeometry();
  let verts = new Float32Array(bed);
  let colors = new Uint8Array(bedColor);
  bedGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  bedGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
  bedGeom.name = 'straight';
  bedGeom.userData = road;
  bedGeom.computeVertexNormals();
  bedGeom.normalizeNormals();

  let kerbGeom = new THREE.BufferGeometry();
  let kerbVerts = new Float32Array(kerb);
  let kerbColors = new Uint8Array(kerbColor);
  kerbGeom.setAttribute('position', new THREE.BufferAttribute(kerbVerts, 3));
  kerbGeom.setAttribute('color', new THREE.BufferAttribute(kerbColors, 3, true));
  kerbGeom.name = 'straight';
  kerbGeom.userData = road;
  kerbGeom.computeVertexNormals();
  kerbGeom.normalizeNormals();

  return {
    bed: bedGeom,
    kerb: kerbGeom,
  };
};
