import { ShapeStyle } from '@luciad/ria/view/style/ShapeStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import {
  closeToHorizontalPointCheck,
  closeToVerticalLineCheck,
  createTranslationForOrientedBox,
  horizontalMouseRotateCheck,
  horizontalRotateInteraction,
  verticalMovePointInteraction,
} from '../../handle/ControllerHandleInteractionFactory';
import { Point } from '@luciad/ria/shape/Point';
import { Map } from '@luciad/ria/view/Map';
import { ControllerHandle } from '../../handle/ControllerHandleTyped';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';
import { cross, normalize, rayPlaneIntersection, sub, toPoint } from '../../util/Vector3Util';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { EVENT_HANDLED, EVENT_IGNORED, HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { Vector3 } from '@luciad/ria/util/Vector3';
import { Handle } from '@luciad/ria/util/Evented';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { RotateHandleSupport } from './RotateHandleSupport';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import {
  createHorizontalBarbedArcArrow,
  createHorizontalBarbedCrossArrow,
  createVerticalBarbedLineArrow,
} from '../../util/AdvancedShapeFactory';
import { createEllipsoidalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { AltitudeHandleSupport } from './AltitudeHandleSupport';
import { MoveHandleSupport } from './MoveHandleSupport';
import { calculatePointingDirection } from '../../util/PerspectiveCameraUtil';
import {CRSEnum} from '../../../interfaces/CRS.enum';

const DEFAULT_HANDLE_STYLE: ShapeStyle = {
  fill: {
    color: 'rgb(255,255,255)',
  },
  occlusionMode: OcclusionMode.VISIBLE_ONLY,
};

const OCCLUDED_HANDLE_STYLE: ShapeStyle = {
  fill: {
    color: 'rgba(255,255,255,0.5)',
  },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

const FOCUSED_HANDLE_STYLE: ShapeStyle = {
  fill: {
    color: 'rgb(116,207,221)',
    bloom: {
      intensity: 0.7,
    },
  },
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
};

export const CRS_84 = getReference(CRSEnum.CRS_84);
export const STYLE_UPDATED_EVENT = 'StyleUpdated';
export const POSITION_UPDATED_EVENT = 'PositionUpdated';
export const MOVED_EVENT = 'Moved';
export const ROTATED_EVENT = 'Rotated';
export const ALTITUDE_CHANGED_EVENT = 'AltitudeChanged';

const EPSG_4978 = getReference(CRSEnum.EPSG_4978);
const GEODESY = createEllipsoidalGeodesy(CRS_84);

/**
 * Returns the azimuth from the camera to the given point.
 */
function calculateAzimuthTo(map: Map, pointLLH: Point) {
  const cameraPoint = createTransformation(map.reference, pointLLH.reference).transform(map.camera.eyePoint);
  return GEODESY.forwardAzimuth(pointLLH, cameraPoint);
}

/**
 * Support for controllers that need to translate and rotate objects in a geolocation context.
 */
export class GeolocateHandleSupport {
  private readonly _eventSupport = new EventedSupport(
    [STYLE_UPDATED_EVENT, POSITION_UPDATED_EVENT, MOVED_EVENT, ROTATED_EVENT, ALTITUDE_CHANGED_EVENT],
    true,
  );

  private readonly _moveHandle: ControllerHandle = new ControllerHandle();
  private readonly _rotateHandle: ControllerHandle<number> = new ControllerHandle();
  private readonly _altitudeHandle: ControllerHandle = new ControllerHandle();

  private _altitudeUpdateHandle: Handle | null = null;
  private _rotateSupport: RotateHandleSupport | null = null;
  private _altitudeSupport: AltitudeHandleSupport | null = null;
  private _moveSupport: MoveHandleSupport | null = null;

  updateHandles(map: Map, bottomCenterLLH: Point, width: number, depth: number) {
    this.updateMoveHandle(map, bottomCenterLLH, width, depth);
    this.updateRotateHandle(map, bottomCenterLLH, width, depth);
    this.updateAltitudeHandle(map, bottomCenterLLH, width, depth);

    this._altitudeUpdateHandle?.remove();
    this._altitudeUpdateHandle = map.on('MapChange', () => {
      this.updateAltitudeHandle(map, bottomCenterLLH, width, depth);
      this._eventSupport.emit(STYLE_UPDATED_EVENT);
    });
  }

  resetHandles() {
    this._moveHandle.update(null, null, () => false);
    this._rotateHandle.update(null, null, () => false);
    this._altitudeHandle.update(null, null, () => false);

    if (this._altitudeUpdateHandle) {
      this._altitudeUpdateHandle.remove();
      this._altitudeUpdateHandle = null;
    }

    this.clearSupports();
  }

  /**
   * Updates the given move handle's shapes and interaction function to be used for geolocation.
   */
  private updateMoveHandle(map: Map, bottomCenterLLH: Point, width: number, depth: number) {
    const size = Math.min(width, depth) / 3;
    const moveArrows = createHorizontalBarbedCrossArrow(bottomCenterLLH, size, 45, size / 2, size / 7);
    this._moveHandle.update(
      moveArrows,
      moveArrows,
      closeToHorizontalPointCheck(map, bottomCenterLLH, {
        maxWorldDistance: size,
      }),
    );
  }

  /**
   * Updates the given rotate handle's shapes and interaction function to be used for geolocation.
   */
  private updateRotateHandle(map: Map, bottomCenterLLH: Point, width: number, depth: number) {
    const azimuth = 270;
    const radius = Math.min(width, depth) / 2;
    const rotateHandleShape = createHorizontalBarbedArcArrow(
      bottomCenterLLH,
      radius,
      azimuth,
      60,
      radius / 6,
      radius / 21,
    );

    this._rotateHandle.update(
      rotateHandleShape,
      rotateHandleShape,
      horizontalMouseRotateCheck(map, bottomCenterLLH, radius, azimuth, 60, 20),
    );
  }

  /**
   * Updates the given altitude handle's shapes and interaction function to be used for geolocation.
   */
  private updateAltitudeHandle(map: Map, bottomCenterLLH: Point, width: number, depth: number) {
    const lineSize = Math.min(width, depth) / 1.5;

    const azimuth = calculateAzimuthTo(map, bottomCenterLLH);
    const arrowBottom = bottomCenterLLH.copy();
    arrowBottom.z -= lineSize / 2;
    const arrowTop = bottomCenterLLH.copy();
    arrowTop.z += lineSize / 2;
    const verticalArrow = createVerticalBarbedLineArrow(arrowBottom, lineSize, azimuth, lineSize / 6, lineSize / 21);

    this._altitudeHandle.update(
      verticalArrow,
      verticalArrow,
      closeToVerticalLineCheck(map, arrowBottom, arrowTop, true, {
        maxWorldDistance: lineSize / 5,
      }),
    );
  }

  handleGestureEvent(map: Map, event: GestureEvent, bottomCenter: Point): HandleEventResult {
    if (
      event.type === GestureEventType.MOVE ||
      (event.type === GestureEventType.DRAG &&
        event.inputType === 'touch' &&
        !this._moveHandle.focused &&
        !this._rotateHandle.focused &&
        !this._altitudeHandle.focused)
    ) {
      return this.handleMove(event);
    } else if (event.type === GestureEventType.DRAG) {
      return this.handleDrag(map, event, bottomCenter);
    } else if (event.type === GestureEventType.DRAG_END) {
      const focusedHandle = this.getFocusedHandle();
      if (focusedHandle) {
        focusedHandle.interactionFunction = null;
      }
      this.clearSupports();
    }

    return EVENT_IGNORED;
  }

  private clearSupports() {
    this._rotateSupport = null;
    this._altitudeSupport = null;
    this._moveSupport?.clear();
    this._moveSupport = null;
  }

  private handleMove(event: GestureEvent) {
    const lastFocusedHandle = this.getFocusedHandle();

    this._moveHandle.focused = !!this._moveHandle.interactsWithMouseFunction?.(event.viewPoint);
    this._rotateHandle.focused =
      !this._moveHandle.focused && !!this._rotateHandle.interactsWithMouseFunction?.(event.viewPoint);
    this._altitudeHandle.focused =
      !this._moveHandle.focused &&
      !this._rotateHandle.focused &&
      !!this._altitudeHandle.interactsWithMouseFunction?.(event.viewPoint);

    if (this.getFocusedHandle() !== lastFocusedHandle) {
      this._eventSupport.emit(STYLE_UPDATED_EVENT);
    }
    return EVENT_IGNORED;
  }

  private handleDrag(map: Map, event: GestureEvent, bottomCenter: Point) {
    if (!this.getFocusedHandle()) {
      return EVENT_IGNORED;
    }

    if (this._moveHandle.focused) {
      this._eventSupport.emit(MOVED_EVENT, this.processOrientedBoxTranslation(map, event, bottomCenter));
    } else if (this._rotateHandle.focused) {
      this._eventSupport.emit(ROTATED_EVENT, this.calculateRotation(map, event, bottomCenter));
    } else if (this._altitudeHandle.focused) {
      this._eventSupport.emit(ALTITUDE_CHANGED_EVENT, this.calculateAltitudeTranslation(map, event, bottomCenter));
    }
    this._eventSupport.emit(POSITION_UPDATED_EVENT);
    return EVENT_HANDLED;
  }

  /**
   * Returns the rotation from the first view point to the given event's view point around the given bottom center point.
   */
  private calculateRotation(map: Map, event: GestureEvent, bottomCenter: Point) {
    const tx = createTransformation(map.reference, CRS_84);
    const bottomCenterLLH = tx.transform(bottomCenter);
    if (!this._rotateHandle.interactionFunction) {
      this._rotateHandle.interactionFunction = horizontalRotateInteraction(map, event.viewPoint, bottomCenter);
      const v2w = map.getViewToMapTransformation(LocationMode.ELLIPSOID, {
        heightOffset: bottomCenterLLH.z,
      });
      this._rotateSupport = new RotateHandleSupport(bottomCenterLLH, tx.transform(v2w.transform(event.viewPoint)));
    }
    const rotation = ((this._rotateHandle.interactionFunction(event.viewPoint) + 180) % 360) - 180;
    this._rotateSupport.update(rotation);
    return rotation;
  }

  /**
   * Returns the vertical translation relative from the given bottom center to the new bottom center derived from the
   * given event's view point.
   */
  private calculateAltitudeTranslation(map: Map, event: GestureEvent, bottomCenter: Point) {
    if (!this._altitudeHandle.interactionFunction) {
      this._altitudeHandle.interactionFunction = verticalMovePointInteraction(map, event.viewPoint, bottomCenter);

      const upDirection = normalize(bottomCenter);
      const rightDirection = cross(sub(bottomCenter, map.camera.eye), upDirection);
      const planeNormal = cross(rightDirection, upDirection);
      const touchedPointAtStart = rayPlaneIntersection(
        map.camera.eye,
        calculatePointingDirection(map, event.viewPoint),
        planeNormal,
        bottomCenter,
      );

      this._altitudeSupport = new AltitudeHandleSupport(
        toPoint(EPSG_4978, touchedPointAtStart),
        GEODESY.distance(this._altitudeHandle.defaultShape.focusPoint, this._rotateHandle.defaultShape.focusPoint) / 2,
      );
    }
    const newBottomCenter = createTransformation(getReference(CRSEnum.CRS_84), bottomCenter.reference).transform(
      this._altitudeHandle.interactionFunction(event.viewPoint),
    );
    const translation = sub(newBottomCenter, bottomCenter);
    this._altitudeSupport.addTranslation(map, translation);
    return translation;
  }

  /**
   * Draws the geolocation handles on the given geoCanvas.
   */
  drawHandles(geoCanvas: GeoCanvas) {
    if (!this._rotateHandle.interactionFunction && !this._altitudeHandle.interactionFunction) {
      if (this._moveHandle.focused) {
        if (this._moveSupport) {
          this._moveSupport.drawBody(geoCanvas);
        } else {
          geoCanvas.drawShape(this._moveHandle.focusedShape, FOCUSED_HANDLE_STYLE);
        }
      } else {
        geoCanvas.drawShape(this._moveHandle.defaultShape, DEFAULT_HANDLE_STYLE);
        geoCanvas.drawShape(this._moveHandle.defaultShape, OCCLUDED_HANDLE_STYLE);
      }
    }

    if (!this._moveHandle.interactionFunction && !this._altitudeHandle.interactionFunction) {
      if (this._rotateHandle.focused) {
        if (this._rotateSupport) {
          this._rotateSupport.drawBody(geoCanvas);
        } else {
          geoCanvas.drawShape(this._rotateHandle.focusedShape, FOCUSED_HANDLE_STYLE);
        }
      } else {
        geoCanvas.drawShape(this._rotateHandle.defaultShape, DEFAULT_HANDLE_STYLE);
        geoCanvas.drawShape(this._rotateHandle.defaultShape, OCCLUDED_HANDLE_STYLE);
      }
    }

    if (!this._moveHandle.interactionFunction && !this._rotateHandle.interactionFunction) {
      if (this._altitudeHandle.focused) {
        if (this._altitudeSupport) {
          this._altitudeSupport.drawBody(geoCanvas);
        } else {
          geoCanvas.drawShape(this._altitudeHandle.focusedShape, FOCUSED_HANDLE_STYLE);
        }
      } else {
        geoCanvas.drawShape(this._altitudeHandle.defaultShape, DEFAULT_HANDLE_STYLE);
        geoCanvas.drawShape(this._altitudeHandle.defaultShape, OCCLUDED_HANDLE_STYLE);
      }
    }
  }

  /**
   * Draws the labels of the geolocation handles on the given geoCanvas.
   */
  drawHandleLabels(labelCanvas: LabelCanvas) {
    if (this._rotateSupport) {
      this._rotateSupport.drawLabel(labelCanvas);
    }
    if (this._altitudeSupport) {
      this._altitudeSupport.drawLabel(labelCanvas);
    }
    if (this._moveSupport) {
      this._moveSupport.drawLabel(labelCanvas);
    }
  }

  private getFocusedHandle(): ControllerHandle<unknown> | undefined {
    return [this._moveHandle, this._rotateHandle, this._altitudeHandle].find(({ focused }) => focused);
  }

  private processOrientedBoxTranslation(map: Map, event: GestureEvent, bottomCenter: Point): Vector3 {
    if (!this._moveHandle.interactionFunction) {
      this._moveHandle.interactionFunction = createTranslationForOrientedBox(map, event.viewPoint, bottomCenter, {
        fixedHeight: true,
      });

      const bottomCenterLLH = createTransformation(bottomCenter.reference, CRS_84).transform(bottomCenter);
      const initPoint = map
        .getViewToMapTransformation(LocationMode.ELLIPSOID, {
          heightOffset: bottomCenterLLH.z,
        })
        .transform(event.viewPoint);
      this._moveSupport = new MoveHandleSupport(
        map,
        initPoint,
        GEODESY.distance(this._altitudeHandle.defaultShape.focusPoint, this._rotateHandle.defaultShape.focusPoint) * 3,
      );
    }
    const updatedBottomCenter = createTransformation(CRS_84, bottomCenter.reference).transform(
      this._moveHandle.interactionFunction(event.viewPoint),
    );
    const translatedVector = sub(updatedBottomCenter, bottomCenter);
    this._moveSupport?.addTranslation(translatedVector);
    return translatedVector;
  }

  // /**
  //  * An event indicating that the handles should be redrawn.
  //  */
  // on(event: typeof STYLE_UPDATED_EVENT, callback: () => void): Handle;
  //
  // /**
  //  * An event indicating that the handles should be recalculated.
  //  */
  // on(event: typeof POSITION_UPDATED_EVENT, callback: () => void): Handle;
  //
  // /**
  //  * An event indicating that the object that is being geolocated was moved horizontally with given translation
  //  * in EPSG:4978.
  //  */
  // on(event: typeof MOVED_EVENT, callback: (translation: Vector3) => void): Handle;
  //
  // /**
  //  * An event indicating that the object that is being geolocated was rotated around the vertical axis with  given total
  //  * rotation in degrees since the start of the interaction
  //  */
  // on(event: typeof ROTATED_EVENT, callback: (rotation: number) => void): Handle;
  //
  // /**
  //  * An event indicating that the object that is being geolocated was moved vertically with given translation
  //  * in EPSG:4978.
  //  */
  // on(event: typeof ALTITUDE_CHANGED_EVENT, callback: (translation: Vector3) => void): Handle;

  on(
    event:
      | typeof STYLE_UPDATED_EVENT
      | typeof MOVED_EVENT
      | typeof POSITION_UPDATED_EVENT
      | typeof ROTATED_EVENT
      | typeof ALTITUDE_CHANGED_EVENT,
    callback: (...args: unknown[]) => void,
  ): Handle {
    return this._eventSupport.on(event, callback);
  }
}
