import { Vector3 } from '@luciad/ria/util/Vector3';
import { LookFrom } from '@luciad/ria/view/camera/LookFrom';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { v4 as uuidv4 } from 'uuid';
import { MEASUREMENTS_MODEL_REFERENCE } from '../controllers/ruler3d/measurement/Measurement';
import { createMeasurement } from '../controllers/ruler3d/measurement/MeasurementUtil';
import { MeasurementWrapper, restoreFromPersistentMeasurementWrapper } from './MeasurementWrapper';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { GeoJsonCodec } from '@luciad/ria/model/codec/GeoJsonCodec';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import {CRSEnum} from './CRS.enum';
import {EAnnotationsTypes} from './EAnnotationsTypes';
const MEASUREMENT_PREFIX = 'MEASUREMENT_';
export interface PersistedMeasurement {
  id: string;
  name: string;
  expanded: boolean;
  fit_position: LookFrom;
  measurement: {
    type: EAnnotationsTypes;
    points: Vector3[];
  };
  asset: number;
  part: number;
  user: string;
  userInfo?: { name: string; surname: string };
  created_at: Date;
  offset?: number;
}

export interface SerializedFeature {
  id: string | number;
  properties: { [key: string]: unknown };
  shape: { [key: string]: unknown };
}

/**
 * Returns a serializable Feature
 */
export function serializeFeature(feature: Feature) {
  const codec = new GeoJsonCodec({ generateIDs: true });
  return {
    id: feature.id,
    properties: feature.properties,
    shape: codec.encodeShape(feature.shape),
  } as SerializedFeature;
}

/**
 * Returns deserializes  Feature
 */
export function deserializeFeature(feature: SerializedFeature, annotationItem?: PersistedMeasurement) {
  const codec = new GeoJsonCodec({ generateIDs: true });
  const shape = codec.decodeGeometry(JSON.stringify(feature.shape), getReference(CRSEnum.CRS_84));
  const measurementWrapper = annotationItem ? restoreFromPersistentMeasurementWrapper(annotationItem) : undefined;
  const properties = { ...feature.properties, measurementWrapper };
  return new Feature(shape, properties, annotationItem.id);
}

/**
 * Returns a serializable LookFrom object with minimal fields from a possibly more complex LookFrom object
 */
export function toSimpleLookFrom({ eye: { x, y, z }, pitch, yaw, roll }: LookFrom): LookFrom {
  return {
    eye: { x, y, z },
    pitch,
    yaw,
    roll,
  };
}
/**
 * Returns a serializable Vector3 object with minimal fields from a possibly more complex Vector3 object
 */
export function toSimpleVector3({ x, y, z }: Vector3): Vector3 {
  return { x, y, z };
}
/**
 * Fetches all persisted measurements from the browser's local storage
 */
export function loadAllMeasurements(): MeasurementWrapper[] {
  const result = [] as MeasurementWrapper[];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(MEASUREMENT_PREFIX)) {
      const persistedMeasurement = JSON.parse(window.localStorage.getItem(key)) as PersistedMeasurement;
      result.push({
        id: persistedMeasurement.id,
        name: persistedMeasurement.name,
        expanded: persistedMeasurement.expanded,
        fit_position: persistedMeasurement.fit_position,
        created_at: persistedMeasurement.created_at,
        asset: persistedMeasurement.asset,
        part: persistedMeasurement.part,
        user: persistedMeasurement.user,
        measurement: createMeasurement(
          persistedMeasurement.measurement.type,
          persistedMeasurement.measurement.points.map(({ x, y, z }) =>
            createPoint(MEASUREMENTS_MODEL_REFERENCE, [x, y, z]),
          ),
          {
            label: persistedMeasurement.name,
            offset: persistedMeasurement.offset,
          },
        ),
      });
    }
  }
  return result;
}
/**
 * Updates an already persisted measurement.
 * Currently, this does the same as {@link persistMeasurement}
 */
export function updateMeasurement(wrapper: MeasurementWrapper) {
  persistMeasurement(wrapper);
}
/**
 * Persists a given measurement in the browser's local storage
 */
export function persistMeasurement(wrapper: MeasurementWrapper) {
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
  };
  window.localStorage.setItem(MEASUREMENT_PREFIX + wrapper.id, JSON.stringify(persistingObject));
}
/**
 * Remove the given measurement from the browser's local storage
 */
export function deleteMeasurement(wrapper: MeasurementWrapper) {
  window.localStorage.removeItem(MEASUREMENT_PREFIX + wrapper.id);
}
/**
 * Creates a measurement id that can be used to reference a new measurement.
 */
export function createNewMeasurementId(): string {
  return uuidv4();
}
