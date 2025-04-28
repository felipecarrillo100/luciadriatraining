import { Point } from '@luciad/ria/shape/Point';
import { createSphericalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import { createExtrudedShape, createPoint, createPolygon } from '@luciad/ria/shape/ShapeFactory';

export function createHexagon(sensorLocation: Point) {
  const points: Point[] = [];
  const GEODESY = createSphericalGeodesy(sensorLocation.reference as CoordinateReference);
  for (let i = 0; i < 6; ++i) {
    points.push(GEODESY.interpolate(sensorLocation, 1, (i * 360) / 6));
  }
  return createPolygon(sensorLocation.reference as CoordinateReference, points);
}

export function createHexagon2D(sensorLocation: Point) {
  const points: Point[] = [];
  const GEODESY = createSphericalGeodesy(sensorLocation.reference as CoordinateReference);
  for (let i = 0; i < 6; ++i) {
    const point3D = GEODESY.interpolate(sensorLocation, 1, (i * 360) / 6);
    points.push(createPoint(point3D.reference, [point3D.x, point3D.y]));
  }
  return createPolygon(sensorLocation.reference as CoordinateReference, points);
}

export function createHexagon3D(sensorLocation: Point, minHeight: number, maxHeight: number) {
  const shape2D = createHexagon2D(sensorLocation);
  return createExtrudedShape(shape2D.reference, shape2D, minHeight, maxHeight);
}
