import { Polyline } from '@luciad/ria/shape/Polyline';
import { Point } from '@luciad/ria/shape/Point';
import { LookFrom } from '@luciad/ria/view/camera/LookFrom';
import {
  Measurement,
  MEASUREMENTS_MODEL_REFERENCE,
} from '../controllers/ruler3d/measurement/Measurement';
import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { PersistedMeasurement, toSimpleLookFrom, toSimpleVector3 } from './MeasurementPersistenceUtil';
import { createMeasurement } from '../controllers/ruler3d/measurement/MeasurementUtil';
import { createPoint, createPolygon } from '@luciad/ria/shape/ShapeFactory';
import { hull } from '@core/libs/hull/hull';
import {EAnnotationsTypes} from './EAnnotationsTypes';
import {IUserFullName} from '@shared/interfaces/user.interface';

// export interface MeasurementPaintStyles {
//   pointStyles: IconStyle[];
//   mainLineStyles: ShapeStyle[];
//   helperLineStyles: ShapeStyle[];
//   areaStyles: ShapeStyle[];
//   mainLabelHtmlStyle: string;
//   helperLabelHtmlStyle: string;
// }

export interface MeasurementSegment {
  line: Polyline;
  distance: number;
  p1: Point;
  p2: Point;
}

export interface MeasurementWrapper<S extends MeasurementSegment = MeasurementSegment> {
  id: string;
  name: string;
  expanded: boolean;
  measurement: Measurement<S>;
  fit_position: LookFrom;
  created_at: Date;
  asset: number;
  part: number;
  user: string;
  userInfo?: IUserFullName;
  offset?: number;
}

export function createMeasurementWrapper(map: WebGLMap, feature: Feature, measurement: Measurement) {
  const fitPosition = (map.camera as PerspectiveCamera).asLookFrom();
  const measurementWrapper: MeasurementWrapper = {
    id: feature.id as string,
    name: feature.properties.name,
    measurement,
    fit_position: fitPosition,
    expanded: true,
    created_at: feature.properties.created_at,
    asset: feature.properties.asset,
    part: feature.properties.part,
    user: feature.properties.user,
    offset: feature.properties.offset,
  };
  return measurementWrapper;
}

export function createPersistentMeasurementWrapper(wrapper: MeasurementWrapper) {
  const persistingObject: PersistedMeasurement = {
    id: wrapper.id,
    name: wrapper.name,
    expanded: wrapper.expanded,
    fit_position: toSimpleLookFrom(wrapper.fit_position),
    created_at: wrapper.created_at,
    asset: wrapper.asset,
    part: wrapper.part,
    user: wrapper.user,
    measurement: {
      type: wrapper.measurement.type,
      points: wrapper.measurement.getPointListCopy().map(toSimpleVector3),
    },
    offset: wrapper.offset,
  };
  return persistingObject;
}

export function createDBPolygonFromMeasurementWrapper(wrapper: MeasurementWrapper) {
  const points = wrapper.measurement.getPointListCopy().map(toSimpleVector3);
  points.push(points[0]);
  return {
    type: 'Polygon',
    coordinates: [points.map((p) => [p.x, p.y, p.z])],
  };
}

export function createMeasurementWrapperFromDBPolygon(feature: Feature, polygon: { coordinates: number[][][] }) {
  const points = polygon.coordinates[0];
  if (points.length < 3) return null;
  const measurement = {
    type: 'Area',
    points: points.slice(0, -1).map((p) => ({ x: p[0], y: p[1], z: p[2] })),
  } as Measurement;
  const measurementFull: PersistedMeasurement = {
    id: feature.id as string,
    name: feature.properties.name,
    expanded: true,
    fit_position: undefined,
    measurement: measurement,
    created_at: feature.properties.created_at,
    asset: feature.properties.asset,
    part: feature.properties.part,
    user: feature.properties.user,
    offset: feature.properties.offset,
  };
  return restoreFromPersistentMeasurementWrapper(measurementFull);
}

export function createPolygonFromMeasurement(measurement: Measurement) {
  const points = measurement.getPointListCopy();
  const pointSet = points.map((p) => ({ lng: p.x, lat: p.y }));

  if (pointSet.length > 1) {
    const pts = hull(pointSet, 0.0011, ['.lng', '.lat']);
    const pointArray = pts.map((pt) =>
      createPoint(measurement.focusPoint.reference, [pt.lng, pt.lat, measurement.focusPoint.z]),
    );
    return createPolygon(measurement.focusPoint.reference, pointArray);
  } else {
    return createPolygon(measurement.focusPoint.reference, [
      measurement.focusPoint,
      measurement.focusPoint,
      measurement.focusPoint,
    ]);
  }
}

export function restoreFromPersistentMeasurementWrapper(AMeasurement: PersistedMeasurement) {
  const ps =
    typeof AMeasurement.measurement.points === 'string'
      ? JSON.parse(AMeasurement.measurement.points)
      : AMeasurement.measurement.points;
  const allPoints = ps.map(({ x, y, z }) => createPoint(MEASUREMENTS_MODEL_REFERENCE, [x, y, z]));
  const measurement = createMeasurement(AMeasurement.measurement.type as EAnnotationsTypes, allPoints, {
    label: AMeasurement.name,
    offset: AMeasurement.offset,
  });

  const measurementWrapper: MeasurementWrapper = {
    id: AMeasurement.id,
    name: AMeasurement.name,
    expanded: typeof AMeasurement.expanded !== 'undefined' ? AMeasurement.expanded : true,
    fit_position: AMeasurement.fit_position,
    created_at: AMeasurement.created_at,
    asset: AMeasurement.asset,
    part: AMeasurement.part,
    user: AMeasurement.user,
    userInfo: AMeasurement?.userInfo,
    offset: AMeasurement.offset,
    measurement,
  };
  return measurementWrapper;
}
