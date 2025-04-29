import { Map } from '@luciad/ria/view/Map';
import { Point } from '@luciad/ria/shape/Point';
// import { distanceAlongDirection } from './Vector3Util';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import {distanceAlongDirection} from "../controls/util/Vector3Util";
import {DEG2RAD} from "../controls/util/Math";

/**
 * Returns the size in meters that corresponds to an object drawn in pixels at the given point.
 */
export function getSizeInMeters(pixels: number, map: Map, point3D: Point) {
  const viewHeight = map.viewSize[1];
  const perpendicularSize = getPerpendicularSize(map, point3D);

  return computeSizeInMeters(pixels, viewHeight, perpendicularSize);
}

/**
 * Returns the size in pixels that corresponds to an object drawn in meters at the given point.
 */
export function getSizeInPixels(meters: number, map: Map, point3D: Point) {
  const viewHeight = map.viewSize[1];
  const perpendicularSize = getPerpendicularSize(map, point3D);

  return computeSizeInPixels(meters, viewHeight, perpendicularSize);
}

/**
 * Limits the size in meters so that it is not bigger or smaller then given pixel limits.
 */
export function limitSizeInMeters(
  size: number, // in meters
  pixelLimits: number[],
  map: Map,
  point3D: Point
) {
  const viewHeight = map.viewSize[1];
  const perpendicularSize = getPerpendicularSize(map, point3D);
  const pixels = computeSizeInPixels(size, viewHeight, perpendicularSize);

  const [min, max] = pixelLimits;
  if (pixels > max) {
    return computeSizeInMeters(max, viewHeight, perpendicularSize);
  }
  if (pixels < min) {
    return computeSizeInMeters(min, viewHeight, perpendicularSize);
  }
  return size;
}

/**
 * Returns the size in meters at the perpendicular distance from the camera that covers the whole view.
 */
function getPerpendicularSize(map: Map, point3D: Point) {
  const { camera } = map;
  const { eye, forward, fovY } = camera as PerspectiveCamera;

  const halfAngle = (DEG2RAD * fovY) / 2;
  const orthogonalDistance = distanceAlongDirection(point3D, eye, forward);
  return 2 * Math.tan(halfAngle) * orthogonalDistance;
}

function computeSizeInPixels(
  meters: number,
  viewHeight: number,
  perpendicularSize: number
) {
  // meters <-> perpendicularSize
  // pixels <-> vertical viewSize
  return (meters * viewHeight) / perpendicularSize;
}

function computeSizeInMeters(
  pixels: number,
  viewHeight: number,
  perpendicularSize: number
) {
  // meters <-> perpendicularSize
  // pixels <-> vertical viewSize
  return (pixels * perpendicularSize) / viewHeight;
}
