import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { Point } from '@luciad/ria/shape/Point';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { absoluteAngle, add, cross, normalize, sub } from './Vector3Util';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import { createEllipsoidalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { LineType } from '@luciad/ria/geodesy/LineType';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import {CRSEnum} from '../../interfaces/CRS.enum';

const samplingRadiusInPixels = 10;
const angleToleranceInDegrees = 22.5;

const HUMAN_HEIGHT = 1.7;
const CAMERA_DISTANCE_TO_WALL_IN_METERS = 4;
export enum SURFACE_TYPE {
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  SLOPE = 'SLOPE',
  SLOPE_INVERTED = 'SLOPE_INVERTED',
  HORIZONTAL_INVERTED = 'HORIZONTAL_INVERTED',
}

export interface SurfaceInfo {
  angle: number;
  surfaceType: SURFACE_TYPE;
  center: Point;
  camera: Point;
  yaw: number;
}

const WGS_84 = getReference(CRSEnum.CRS_84);
const GEODESY = createEllipsoidalGeodesy(WGS_84);

export class SurfaceCalculations {
  public static surfacePlane(map: WebGLMap, centerPoint: Point) {
    try {
      const rightPoint = createPoint(centerPoint.reference, [centerPoint.x + samplingRadiusInPixels, centerPoint.y]);
      const leftPoint = createPoint(centerPoint.reference, [centerPoint.x - samplingRadiusInPixels, centerPoint.y]);
      const topPoint = createPoint(centerPoint.reference, [centerPoint.x, centerPoint.y + samplingRadiusInPixels]);
      const bottomPoint = createPoint(centerPoint.reference, [centerPoint.x, centerPoint.y - samplingRadiusInPixels]);

      const C = this.transformPoint(map, centerPoint);
      const center = this.reprojectPoint3D(C);
      let revert = false;

      let R = this.transformPoint(map, rightPoint);
      if (!R) {
        R = this.transformPoint(map, leftPoint);
        revert = true;
      }

      let T = this.transformPoint(map, topPoint);
      if (!T) T = this.transformPoint(map, bottomPoint);

      const P = { x: C.x, y: C.y, z: C.z };
      const A = { x: T.x, y: T.y, z: T.z };
      const B = { x: R.x, y: R.y, z: R.z };

      const a = sub(A, P);
      const b = sub(B, P);
      const normal = normalize(cross(a, b));
      const angle = absoluteAngle(normal, map.camera.eyePoint);
      let surfaceType: SURFACE_TYPE = SURFACE_TYPE.SLOPE;
      const cameraVector = add(normal, P);
      const cameraPoint = createPoint(C.reference, [cameraVector.x, cameraVector.y, cameraVector.z]);
      let camera = this.reprojectPoint3D(cameraPoint);
      const lookFrom = (map.camera as PerspectiveCamera).asLookFrom();
      let yaw = lookFrom.yaw;

      if (-angleToleranceInDegrees < angle && angle < angleToleranceInDegrees) surfaceType = SURFACE_TYPE.HORIZONTAL;
      if (90 - angleToleranceInDegrees < angle && angle < 90 + angleToleranceInDegrees)
        surfaceType = SURFACE_TYPE.VERTICAL;
      if (90 + angleToleranceInDegrees <= angle && angle <= 180 - angleToleranceInDegrees)
        surfaceType = SURFACE_TYPE.SLOPE_INVERTED;
      if (180 - angleToleranceInDegrees <= angle && angle <= 180 + angleToleranceInDegrees)
        surfaceType = SURFACE_TYPE.HORIZONTAL_INVERTED;

      switch (surfaceType) {
        case SURFACE_TYPE.HORIZONTAL:
          camera = createPoint(center.reference, [center.x, center.y, center.z + HUMAN_HEIGHT]);
          break;
        case SURFACE_TYPE.SLOPE:
        case SURFACE_TYPE.HORIZONTAL_INVERTED:
        case SURFACE_TYPE.VERTICAL:
          {
            const distance = GEODESY.distance(center, camera);
            const fraction = CAMERA_DISTANCE_TO_WALL_IN_METERS / distance;
            camera = GEODESY.interpolate(center, camera, fraction, LineType.SHORTEST_DISTANCE);
            camera = createPoint(camera.reference, [camera.x, camera.y, center.z]);
            const referencePoint = this.reprojectPoint3D(R);
            const azimuth = revert
              ? GEODESY.forwardAzimuth(referencePoint, center)
              : GEODESY.forwardAzimuth(center, referencePoint);
            yaw = azimuth + 270;
          }
          break;
      }
      return {
        angle,
        surfaceType,
        center,
        camera,
        yaw,
      };
    } catch {
      return null;
    }
  }

  public static transformPointWithReproject(map: WebGLMap, point: Point) {
    try {
      const worldPoint = map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(point);
      return this.reprojectPoint3D(worldPoint);
    } catch {
      return null;
    }
  }

  private static transformPoint(map: WebGLMap, point: Point) {
    try {
      return map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(point);
    } catch {
      return null;
    }
  }
  private static reprojectPoint3D(point: Point, targetProjection = CRSEnum.EPSG_4326) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetProjection = targetProjection === CRSEnum.CRS_84 ? CRSEnum.EPSG_4326 : targetProjection;
    const sourceProjection =
      point.reference?.name === 'WGS_1984' && point.reference.identifier.includes('CRS84')
        ? CRSEnum.EPSG_4326
        : point.reference?.identifier;
    const targetReference = getReference(targetProjection);
    if (sourceProjection === targetProjection) {
      return point;
    } else {
      const transformer = createTransformation(point.reference as CoordinateReference, targetReference);
      return transformer.transform(point);
    }
  }
}
