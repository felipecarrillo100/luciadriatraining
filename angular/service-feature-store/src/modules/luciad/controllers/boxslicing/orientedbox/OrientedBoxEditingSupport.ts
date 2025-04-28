import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Vector3 } from '@luciad/ria/util/Vector3';
import {
  add,
  addArray,
  angle,
  distanceAlongDirection,
  length,
  normalize,
  rotateAroundAxis,
  rotatePointAroundLine,
  scale,
  sub,
  toPoint,
} from '../../util/Vector3Util';
import { createOrientedBox } from '@luciad/ria/shape/ShapeFactory';
import { createTransformationFromGeoLocation } from '@luciad/ria/transformation/Affine3DTransformation';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { interpolate } from '../../util/Math';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import {
  BOUNDARY_BOX_OUTLINE_COLOR,
  drawBox,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxDrawUtil';
import { Feature } from '@luciad/ria/model/feature/Feature';

/**
 * Array containing the indices of four corner points of an oriented box that together define a box's face.
 * For example, [0,2,3,1] defines the box's face at max X.
 */
type FaceIndices = [number, number, number, number];

/**
 * Array containing the distances from the support's origin to the faces of the support's box in one of the support' directions.
 */
type Interval = [number, number];

export type SlideBoxDirection = 'x' | 'y' | 'z';

/**
 * Event that is emitted when the box defined by this support has changed. This support's  box is returned together
 * with this event.
 */
export const BOX_CHANGED_EVENT = 'SliceBoxChangedEvent';

/**
 * Event that is emitted when a distance interval that defines this support's box has changed. The direction, min and
 * max values are returned together with this event.
 */
export const BOX_INTERVAL_CHANGED_EVENT = 'SliceBoxIntervalChangedEvent';

/**
 * Sets the given face to the given target distance from the given origin, only translating along the given direction.
 */
function setFaceToDistance(
  cp: Vector3[],
  face: FaceIndices,
  origin: Vector3,
  direction: Vector3,
  targetDistance: number,
) {
  const currentDistance = distanceAlongDirection(cp[face[0]], origin, direction);
  const translation = scale(direction, targetDistance - currentDistance);

  for (const faceIndex of face) {
    cp[faceIndex] = add(cp[faceIndex], translation);
  }
}

/**
 * Support class used to edit an oriented box.
 * When an "original" box is provided to this class, it is broken up into the following components:
 * <ol>
 *   <li>the boxes origin: the 7th corner point of the given box.</li>
 *   <li>3 direction vectors: vectors from the origin to the 3th, 5th and 6th corner points.
 *   These vectors respectively define the x, y and z directions</li>
 *   <li>3 intervals: a min and max value that denote the distance from the origin to the faces perpendicular
 *   to the x, y or z direction.
 *   the X-interval is thus initially equal to[0, width] </li>
 * </ol>
 *
 * The directions can be changed by using the `rotate` method.
 * The intervals can be modified by using the `set<direction>Interval` methods.
 *
 * As the given oriented boxes' are assumed to be defined in EPSG:4978, this support uses Vectors instead of points.
 *
 * Visual representation of an oriented box:
 *    4--------0
 *   /        /|
 *  /        / |
 * 6--------2  1
 * |        | /
 * |        |/
 * 7--------3
 * (vertex 5 is at the back, adjacent to vertices 7, 4 and 1)
 *
 * X: 7 -> 3
 * Y: 7 -> 5
 * Z: 7 -> 6
 */
export class OrientedBoxEditingSupport {
  private readonly eventedSupport: EventedSupport = new EventedSupport(
    [BOX_CHANGED_EVENT, BOX_INTERVAL_CHANGED_EVENT],
    true,
  );

  private _origin: Vector3 = { x: 0, y: 0, z: 0 };
  private _dirX: Vector3 = { x: 0, y: 0, z: 0 };
  private _dirY: Vector3 = { x: 0, y: 0, z: 0 };
  private _dirZ: Vector3 = { x: 0, y: 0, z: 0 };

  private _intervalX: Interval = [0, 0];
  private _intervalY: Interval = [0, 0];
  private _intervalZ: Interval = [0, 0];
  private _box: OrientedBox | null = null;
  private draw: boolean;
  private _feature: Feature;
  private readonly _additionalBoxes: Feature[];

  constructor(originalBox?: OrientedBox, draw = false, feature?: Feature, additionalBoxes?: Feature[]) {
    this.draw = draw;
    this._feature = feature;
    if (originalBox) {
      this.updateBox(originalBox);
    }
    this._additionalBoxes = additionalBoxes;
  }

  getEventSupport() {
    return this.eventedSupport;
  }

  /**
   * Updates this support's internals using the given box.
   * See the class doc of {@link OrientedBoxEditingSupport} for more info.
   */
  updateBox(originalBox: OrientedBox): void {
    this._box = originalBox;

    const cornerPoints = originalBox.getCornerPoints();
    this._origin = cornerPoints[7];

    const xEdge = sub(cornerPoints[3], cornerPoints[7]);
    this._dirX = normalize(xEdge);
    this._intervalX = [0, length(xEdge)];

    const yEdge = sub(cornerPoints[5], cornerPoints[7]);
    this._dirY = normalize(yEdge);
    this._intervalY = [0, length(yEdge)];

    const zEdge = sub(cornerPoints[6], cornerPoints[7]);
    this._dirZ = normalize(zEdge);
    this._intervalZ = [0, length(zEdge)];
  }

  updateBoxAndNotify(newBox: OrientedBox): void {
    this.updateBox(newBox);
    this.getEventSupport().emit(BOX_CHANGED_EVENT, this._box.copy());
  }

  /**
   * Sets the yz-oriented faces of the oriented box to the given distances, relative to the box's origin.
   * When passing undefined instead of a distance, the respective min/max face will not be moved.
   */
  setXInterval(min?: number, max?: number) {
    if (min === undefined && max === undefined) {
      return;
    }
    if (min !== undefined) {
      this._intervalX[0] = min;
    }
    if (max !== undefined) {
      this._intervalX[1] = max;
    }
    this.setInterval([4, 5, 6, 7], [0, 1, 2, 3], this._dirX, min, max);
    this.eventedSupport.emit(BOX_INTERVAL_CHANGED_EVENT, 'x', this._intervalX[0], this._intervalX[1]);
  }

  /**
   * Sets the xz-oriented faces of the oriented box to the given distances, relative to the box's origin.
   * When passing undefined instead of a distance, the respective min/max face will not be moved.
   */
  setYInterval(min?: number, max?: number) {
    if (min === undefined && max === undefined) {
      return;
    }
    if (min !== undefined) {
      this._intervalY[0] = min;
    }
    if (max !== undefined) {
      this._intervalY[1] = max;
    }
    this.setInterval([2, 3, 6, 7], [0, 1, 4, 5], this._dirY, min, max);
    this.eventedSupport.emit(BOX_INTERVAL_CHANGED_EVENT, 'y', this._intervalY[0], this._intervalY[1]);
  }

  /**
   * Sets the xy-oriented faces of the oriented box to the given distances, relative to the box's origin.
   * When passing undefined instead of a distance, the respective min/max face will not be moved.
   */
  setZInterval(min?: number, max?: number) {
    if (min === undefined && max === undefined) {
      return;
    }
    if (min !== undefined) {
      this._intervalZ[0] = min;
    }
    if (max !== undefined) {
      this._intervalZ[1] = max;
    }
    this.setInterval([1, 3, 5, 7], [0, 2, 4, 6], this._dirZ, min, max);
    this.eventedSupport.emit(BOX_INTERVAL_CHANGED_EVENT, 'z', this._intervalZ[0], this._intervalZ[1]);
  }

  private setInterval(minFace: FaceIndices, maxFace: FaceIndices, direction: Vector3, min?: number, max?: number) {
    if ((min === undefined && max === undefined) || !this._box) {
      return;
    }

    const cp = this._box.getCornerPoints();
    if (min !== undefined) {
      setFaceToDistance(cp, minFace, this._origin, direction, min);
    }
    if (max !== undefined) {
      setFaceToDistance(cp, maxFace, this._origin, direction, max);
    }

    this.recalculateBox();
  }

  /**
   * Translate this support's origin with the given translation vector.
   */
  translate(translation: Vector3) {
    this._origin = add(this._origin, translation);
    this.recalculateBox();
  }

  /**
   * Rotates the origin and directions of this support around the given center along the Z direction with the given angle.
   * As long as the z-direction is pointing upwards, this rotates the oriented box horizontally.
   */
  rotateAroundZ(center: Vector3, relativeAngle: number) {
    this._origin = rotatePointAroundLine(this._origin, center, this._dirZ, relativeAngle);
    this._dirX = rotateAroundAxis(this._dirX, this._dirZ, relativeAngle);
    this._dirY = rotateAroundAxis(this._dirY, this._dirZ, relativeAngle);
    this._dirZ = rotateAroundAxis(this._dirZ, this._dirZ, relativeAngle);
    this.recalculateBox();
  }

  private recalculateBox() {
    //FIXME: get north/up from geodesy as this is not super clean
    const northFacingCamera = new PerspectiveCamera(
      this._origin,
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      0.5,
      10,
      600,
      10,
      60,
      this._box.reference,
    ).lookFrom({
      eye: this._origin,
      roll: 0,
      pitch: 0,
      yaw: 0,
    });

    this._box = createOrientedBox(
      createTransformationFromGeoLocation(toPoint(this._box.reference, this._origin), {
        azimuth: angle(this._dirX, northFacingCamera.forward, northFacingCamera.up) - 90,
      }),
      { x: this._intervalX[0], y: this._intervalY[0], z: this._intervalZ[0] },
      {
        x: this._intervalX[1] - this._intervalX[0],
        y: this._intervalY[1] - this._intervalY[0],
        z: this._intervalZ[1] - this._intervalZ[0],
      },
    );
    this.eventedSupport.emit(BOX_CHANGED_EVENT, this._box.copy());
  }

  /**
   * Returns the distance from this support's origin to the yz-oriented faces of the oriented box.
   */
  getXInterval(): [number, number] {
    return [...this._intervalX];
  }

  /**
   * Returns the distance from this support's origin to the xy-oriented faces of the oriented box.
   */
  getYInterval(): [number, number] {
    return [...this._intervalY];
  }

  /**
   * Returns the distance from this support's origin to the yz-oriented faces of the oriented box.
   */
  getZInterval(): [number, number] {
    return [...this._intervalZ];
  }

  /**
   * Returns the center of the xy-oriented face closest to the origin.
   * As long as the z-direction is pointing upwards, this is the bottom center of the oriented box.
   */
  getXYCenter(): Vector3 {
    return addArray([
      this._origin,
      scale(this._dirX, interpolate(this._intervalX[0], this._intervalX[1], 0.5)),
      scale(this._dirY, interpolate(this._intervalY[0], this._intervalY[1], 0.5)),
    ]);
  }

  /**
   * Calculates the distance from the given point to this support's origin, along this support's x-direction.
   */
  calculateXDistance(point: Vector3) {
    return distanceAlongDirection(point, this._origin, this._dirX);
  }

  /**
   * Calculates the distance from the given point to this support's origin, along this support's y-direction.
   */
  calculateYDistance(point: Vector3) {
    return distanceAlongDirection(point, this._origin, this._dirY);
  }

  /**
   * Calculates the distance from the given point to this support's origin, along this support's z-direction.
   */
  calculateZDistance(point: Vector3) {
    return distanceAlongDirection(point, this._origin, this._dirZ);
  }

  /**
   * Returns the oriented box defined by this support.
   */
  getBox(): OrientedBox {
    if (!this._box) {
      throw new Error('OrientedBoxEditingSupport should be valid');
    }
    return this._box;
  }

  on(
    event: typeof BOX_CHANGED_EVENT | typeof BOX_INTERVAL_CHANGED_EVENT,
    callback: ((box: OrientedBox) => void) | ((direction: SlideBoxDirection, min: number, max: number) => void),
  ) {
    return this.eventedSupport.on(event, callback);
  }

  onDraw(geoCanvas: GeoCanvas) {
    if (this.draw) {
      drawBox(geoCanvas, this._box as OrientedBox, {
        hightlighted: false,
        withOccludedPart: true,
        color: this._feature?.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
      });
    }
    for (const feature of this._additionalBoxes) {
      drawBox(geoCanvas, feature.shape as OrientedBox, {
        hightlighted: false,
        withOccludedPart: true,
        color: feature.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
      });
    }
  }
}
