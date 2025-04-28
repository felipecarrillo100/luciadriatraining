import { Controller } from '@luciad/ria/view/controller/Controller';
import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { BOX_CHANGED_EVENT, OrientedBoxEditingSupport } from './orientedbox/OrientedBoxEditingSupport';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { Map } from '@luciad/ria/view/Map';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { Polygon } from '@luciad/ria/shape/Polygon';
import { Handle } from '@luciad/ria/util/Evented';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { Point } from '@luciad/ria/shape/Point';
import { Vector3 } from '@luciad/ria/util/Vector3';
import {
  absoluteAngle,
  add,
  average,
  distance,
  interpolateVectors,
  invert,
  normalize,
  rayRectangleIntersection,
  sub,
  toPoint,
} from '../util/Vector3Util';
import { clamp } from '../util/Math';
import { ControllerHandle } from '../handle/ControllerHandleTyped';
import { calculatePointingDirection } from '../util/PerspectiveCameraUtil';
import { closeToPointCheck, directionalMovePointInteraction } from '../handle/ControllerHandleInteractionFactory';
import { createFacePolygons } from '../util/AdvancedShapeFactory';
import { drawFacePolygon } from './orientedbox/OrientedBoxDrawUtil';

const resizeIcon = './assets/icons/resizeSlider.svg';

const DEFAULT_HANDLE_STYLE = {
  url: resizeIcon,
  width: '40px',
  height: '40px',
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
};

const FOCUSED_HANDLE_STYLE = {
  url: resizeIcon,
  width: '40px',
  height: '40px',
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
  opacity: 0.5,
};

/**
 * Minimal distance in meters between two opposite sides of an oriented box when resizing
 */
const MINIMAL_INTERVAL_WIDTH = 0.01;

/**
 * Max interval length in meters, to avoid issues with the fact that oriented boxes do not curve with the earth
 */
const MAX_INTERVAL_WIDTH = 10_000;

export interface BoxResizeControllerCreateOptions {
  /**
   * Defines what needs to happen when a user clicks on the map.
   * @param intersectsBox whether the user clicked inside the box that is being edited or not.
   */
  onClick?: (intersectsBox: boolean) => void;
}

/**
 * Controller used to resize an oriented box.
 * The box is resized by dragging the box's 6 face planes in the direction perpendicular to the respective planes.
 */
export class BoxResizeController extends Controller {
  private readonly _support: OrientedBoxEditingSupport;
  private readonly _resizeHandle = new BoxResizeHandle();
  private readonly _onClick?: (intersectsBox: boolean) => void;
  private readonly _defaultHandleStyle: IconStyle = Object.assign({}, DEFAULT_HANDLE_STYLE);
  private readonly _focusedHandleStyle: IconStyle = Object.assign({}, FOCUSED_HANDLE_STYLE);

  private _facePolygons: Polygon[];
  private _hoveredFaceIndex: number | null = null;
  private _boxCenter: Vector3;
  private _upVector: Vector3 = { x: 0, y: 0, z: 0 };
  private _hoverListenHandle: Handle | null = null;

  constructor(support: OrientedBoxEditingSupport, options?: BoxResizeControllerCreateOptions) {
    super();
    this._support = support;
    this._onClick = options?.onClick;

    const initialBox = support.getBox();
    this._facePolygons = createFacePolygons(initialBox);

    this._boxCenter = toPoint(initialBox.reference, average(initialBox.getCornerPoints()));

    this._support.on(BOX_CHANGED_EVENT, (box: OrientedBox) => {
      this._facePolygons = createFacePolygons(box);
      this._boxCenter = toPoint(box.reference, average(box.getCornerPoints()));
      if (this._resizeHandle.resizingFaceId !== null && this.map) {
        this.updateResizeHandle(this._resizeHandle.resizingFaceId);
      }
    });
  }

  onActivate(map: Map) {
    const northFacingCamera = (map.camera as PerspectiveCamera).lookFrom({
      eye: map.camera.eye,
      roll: 0,
      yaw: 0,
      pitch: 0,
    });
    this._upVector = normalize(northFacingCamera.up);

    super.onActivate(map);
  }

  private updateResizeHandle(faceId: number) {
    if (!this.map) {
      return;
    }
    const hoveredFace = this._facePolygons[faceId];
    const botLeft = hoveredFace.getPoint(0);
    const topRight = hoveredFace.getPoint(2);
    const center = interpolateVectors(botLeft, topRight, 0.5);
    const centerPoint = createPoint(hoveredFace.reference, [center.x, center.y, center.z]);
    this._resizeHandle.update(centerPoint, centerPoint, closeToPointCheck(this.map, centerPoint, { sensitivity: 20 }));

    const dir = sub(center, this._boxCenter);
    //icon rotation only works correctly in 90° increments (otherwise it depends on which angle you're looking from)
    const rotation = Math.round((90 - absoluteAngle(dir, this._upVector)) / 90) * 90;
    this._defaultHandleStyle.rotation = rotation;
    this._focusedHandleStyle.rotation = rotation;

    this._resizeHandle.resizingFaceId = faceId;
    this._resizeHandle.validInterval = this.getResizableInterval(faceId);
  }

  onDeactivate(map: Map): void {
    this._hoverListenHandle?.remove();
    super.onDeactivate(map);
  }

  onDraw(geoCanvas: GeoCanvas) {
    this._support.onDraw(geoCanvas);

    if (this._hoveredFaceIndex !== null) {
      drawFacePolygon(geoCanvas, this._facePolygons[this._hoveredFaceIndex], true);
    }

    if (this._resizeHandle.defaultShape) {
      if (this._resizeHandle.focused) {
        geoCanvas.drawShape(this._resizeHandle.defaultShape, this._focusedHandleStyle);
      } else {
        geoCanvas.drawShape(this._resizeHandle.defaultShape, this._defaultHandleStyle);
      }
    }
  }

  onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map) {
      return HandleEventResult.EVENT_HANDLED;
    }
    const domEvent = event.domEvent;
    if (domEvent instanceof MouseEvent && event.type === GestureEventType.MOVE) {
      return this.handleMove(event);
    } else if (event.type === GestureEventType.DRAG && this._resizeHandle.focused) {
      return this.handleDrag(event);
    } else if (event.type === GestureEventType.DRAG_END) {
      this._resizeHandle.endInteraction();
      this.invalidate();
    } else if (event.type === GestureEventType.SINGLE_CLICK_UP && this._onClick) {
      this._onClick(this.findClosestIntersectedFace(event.viewPoint) != null);
      return HandleEventResult.EVENT_HANDLED;
    }
    return super.onGestureEvent(event);
  }

  private handleMove(event: GestureEvent) {
    let invalidate = false;

    const previousHoveredFace = this._hoveredFaceIndex;
    this._hoveredFaceIndex = this.findClosestIntersectedFace(event.viewPoint);
    if (previousHoveredFace === this._hoveredFaceIndex) {
      if (this._hoveredFaceIndex !== null) {
        this.updateResizeHandle(this._hoveredFaceIndex);
      } else {
        this._resizeHandle.clear();
      }
      invalidate = true;
    }

    if (this._resizeHandle.interactsWithMouseFunction) {
      this._resizeHandle.focused = this._resizeHandle.interactsWithMouseFunction(event.viewPoint);
      invalidate = true;
    }
    if (invalidate) {
      this.invalidate();
    }
    return HandleEventResult.EVENT_IGNORED;
  }

  private handleDrag(event: GestureEvent) {
    if (!this._resizeHandle.interactionFunction) {
      const faceCenter = this._resizeHandle.defaultShape;
      if (faceCenter instanceof Point) {
        this._resizeHandle.interactionFunction = directionalMovePointInteraction(
          this.map,
          faceCenter,
          add(faceCenter, invert(this._boxCenter)),
        );
      } else {
        return super.onGestureEvent(event);
      }
    }
    const newFaceCenter = this._resizeHandle.interactionFunction(event.viewPoint);
    const faceId = this._resizeHandle.resizingFaceId as number;
    const [minDistance, maxDistance] = this._resizeHandle.validInterval as [number, number];
    this.setDistance(faceId, clamp(this.calculateDistance(faceId, newFaceCenter), minDistance, maxDistance));
    this.invalidate();
    return HandleEventResult.EVENT_HANDLED;
  }

  private setDistance(faceId: number, value: number) {
    switch (faceId) {
      case 0:
        return this._support.setXInterval(value);
      case 1:
        return this._support.setXInterval(undefined, value);
      case 2:
        return this._support.setYInterval(value);
      case 3:
        return this._support.setYInterval(undefined, value);
      case 4:
        return this._support.setZInterval(value);
      case 5:
        return this._support.setZInterval(undefined, value);
    }
  }

  /**
   * Calculates the distance from the given point to the origin of this controller's support, along the normal of the
   * given face.
   */
  private calculateDistance(faceId: number, point: Vector3) {
    if (faceId < 2) {
      return this._support.calculateXDistance(point);
    } else if (faceId < 4) {
      return this._support.calculateYDistance(point);
    } else {
      return this._support.calculateZDistance(point);
    }
  }

  private getResizableInterval(faceId: number): [number, number] {
    switch (faceId) {
      case 0:
        return [
          this._support.getXInterval()[1] - MAX_INTERVAL_WIDTH,
          this._support.getXInterval()[1] - MINIMAL_INTERVAL_WIDTH,
        ];
      case 1:
        return [
          this._support.getXInterval()[0] + MINIMAL_INTERVAL_WIDTH,
          this._support.getXInterval()[0] + MAX_INTERVAL_WIDTH,
        ];
      case 2:
        return [
          this._support.getYInterval()[1] - MAX_INTERVAL_WIDTH,
          this._support.getYInterval()[1] - MINIMAL_INTERVAL_WIDTH,
        ];
      case 3:
        return [
          this._support.getYInterval()[0] + MINIMAL_INTERVAL_WIDTH,
          this._support.getYInterval()[0] + MAX_INTERVAL_WIDTH,
        ];
      case 4:
        return [
          this._support.getZInterval()[1] - MAX_INTERVAL_WIDTH,
          this._support.getZInterval()[1] - MINIMAL_INTERVAL_WIDTH,
        ];
      case 5:
        return [
          this._support.getZInterval()[0] + MINIMAL_INTERVAL_WIDTH,
          this._support.getZInterval()[0] + MAX_INTERVAL_WIDTH,
        ];
      default:
        throw new Error(`unexpected face id: ${faceId}`);
    }
  }

  private findClosestIntersectedFace(viewPoint: Vector3) {
    if (!this.map) {
      return null;
    }
    const eye = (this.map.camera as PerspectiveCamera).eye;
    const pointingDirection = calculatePointingDirection(this.map, viewPoint);
    let minDistance = Number.MAX_SAFE_INTEGER;
    let closestFeature: number | null = null;
    for (let i = 0; i < 6; i++) {
      const rectangle = this._facePolygons[i];
      const intersectionPoint = rayRectangleIntersection(eye, pointingDirection, rectangle);
      if (intersectionPoint) {
        const intersectionDistance = distance(intersectionPoint, eye);
        if (intersectionDistance < minDistance) {
          minDistance = intersectionDistance;
          closestFeature = i;
        }
      }
    }
    return closestFeature;
  }
}

/**
 * Controller handle used to resize an oriented box by moving one of it's 6 faces.
 */
class BoxResizeHandle extends ControllerHandle<Vector3> {
  private _resizingFaceId: number | null = null;
  private _validInterval: [number, number] | null = null;

  /**
   * Distance interval for which it is valid to move the plane towards.
   * This is used to avoid moving a plane further than it's opposite plane.
   */
  get validInterval(): [number, number] | null {
    return this._validInterval;
  }

  set validInterval(value: [number, number] | null) {
    this._validInterval = value;
  }

  /**
   * The index of the face that is being moved.
   * The order of faces is defined by {@link createFacePolygons}.
   */
  get resizingFaceId(): number | null {
    return this._resizingFaceId;
  }

  set resizingFaceId(value: number | null) {
    this._resizingFaceId = value;
  }

  clear() {
    this.update(null, null, () => false);
    this._resizingFaceId = null;
    this._validInterval = null;
  }
}
