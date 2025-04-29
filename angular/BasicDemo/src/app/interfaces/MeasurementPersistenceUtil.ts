
import {Vector3} from '@luciad/ria/util/Vector3';
import {LookFrom} from '@luciad/ria/view/camera/LookFrom';
import {createPoint} from '@luciad/ria/shape/ShapeFactory';
import {v4 as uuidv4} from 'uuid';
import {MEASUREMENTS_MODEL_REFERENCE, MeasurementType} from "../luciad-map/controls/ruler3d/measurement/Measurement";
import {createMeasurement} from "../luciad-map/controls/ruler3d/measurement/MeasurementUtil";
import {MeasurementWrapper} from "./MeasurementWrapper";

const MEASUREMENT_PREFIX = 'MEASUREMENT_';

export interface PersistedMeasurement {
  id: string;
  name: string;
  expanded: boolean;
  fitPosition: LookFrom;
  measurement: {
    type: MeasurementType;
    points: Vector3[];
  };
}

/**
 * Returns a serializable LookFrom object with minimal fields from a possibly more complex LookFrom object
 */
export function toSimpleLookFrom({
  eye: {x, y, z},
  pitch,
  yaw,
  roll,
}: LookFrom): LookFrom {
  return {
    eye: {x, y, z},
    pitch,
    yaw,
    roll,
  };
}

/**
 * Returns a serializable Vector3 object with minimal fields from a possibly more complex Vector3 object
 */
export function toSimpleVector3({x, y, z}: Vector3): Vector3 {
  return {x, y, z};
}

/**
 * Fetches all persisted measurements from the browser's local storage
 */
export function loadAllMeasurements(): MeasurementWrapper[] {
  const result = [] as MeasurementWrapper[];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(MEASUREMENT_PREFIX)) {
      const persistedMeasurement = JSON.parse(
        window.localStorage.getItem(key)!
      ) as PersistedMeasurement;

      result.push({
        id: persistedMeasurement.id,
        name: persistedMeasurement.name,
        expanded: persistedMeasurement.expanded,
        fitPosition: persistedMeasurement.fitPosition,
        measurement: createMeasurement(
          persistedMeasurement.measurement.type,
          persistedMeasurement.measurement.points.map(({x, y, z}) =>
            createPoint(MEASUREMENTS_MODEL_REFERENCE, [x, y, z])
          )
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
    fitPosition: toSimpleLookFrom(wrapper.fitPosition),
    measurement: {
      type: wrapper.measurement.type,
      points: wrapper.measurement.getPointListCopy().map(toSimpleVector3),
    },
  };
  window.localStorage.setItem(
    MEASUREMENT_PREFIX + wrapper.id,
    JSON.stringify(persistingObject)
  );
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
