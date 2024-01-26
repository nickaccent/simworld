import * as THREE from 'three';

const RIGHT_ANGLE = Math.PI / 2;
export function calculateCurveVertices(radius, segmentCount) {
  const totalArcLength = RIGHT_ANGLE * radius;
  const segmentLength = totalArcLength / segmentCount;
  const segmentAngle = RIGHT_ANGLE / segmentCount;
  return generateAllCurvePoints(segmentCount, segmentAngle, radius);
}

export function generateAllCurvePoints(segmentCount, segmentAngle, radius) {
  const points = [];
  for (let i = 0; i <= segmentCount; i++) {
    points.push(generateCurvePoint(i, segmentAngle, radius));
  }
  points[points.length] = new THREE.Vector3(-0.5, 0, radius - 0.5);
  return points;
}

export function generateCurvePoint(index, angle, radius) {
  const theta = index * angle;
  const curveX = radius * Math.cos(theta);
  const curveY = radius * Math.sin(theta);
  return new THREE.Vector3(curveX - 0.5, 0, curveY - 0.5);
}
