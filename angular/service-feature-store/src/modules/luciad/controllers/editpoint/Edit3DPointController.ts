import { Controller } from '@luciad/ria/view/controller/Controller';
import { Map } from '@luciad/ria/view/Map';
import { Point } from '@luciad/ria/shape/Point';
import { add, distance, distance2d, normalize, projectPointOnLine, scale, sub } from '../util/Vector3Util';
import { createPoint, createPolygon, createPolyline } from '@luciad/ria/shape/ShapeFactory';
import { Vector3 } from '@luciad/ria/util/Vector3';
import { Transformation } from '@luciad/ria/transformation/Transformation';
import { ControllerHandle } from '../handle/ControllerHandle';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Edit3DPointControllerStyles } from './Edit3DPointControllerStyles';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { EVENT_HANDLED, EVENT_IGNORED, HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { linearMovePointInteraction, planarMovePointInteraction } from './Edit3DPointHandleInteractionFactory';
import GeoTools from '../../utils/GeoTools';
import { ImageIconStyle } from '@luciad/ria/view/style/IconStyle';
import { LineType } from '@luciad/ria/geodesy/LineType';
import { createSphericalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { LineStyle } from '@luciad/ria/view/style/LineStyle';
import { Observable, Subject } from 'rxjs';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import {CRSEnum} from '../../interfaces/CRS.enum';

const TOUCH_POINT_THRESHOLD = 20;
// Max distance in pixels to qualify a vertical handle touched
const TOUCH_VERTICAL_THRESHOLD = 15;

const PLANE_SIZE = 5;
enum GeoHandle {
  NONE,
  MOVE,
  ALTITUDE,
}

const enum EditMode {
  /**
   * Indicates that the controller is not in the edit mode. In this mode the path controller will not select a point for editing.
   */
  INACTIVE,
  /**
   * Indicates that the controller is in the edit mode for changing point position.
   */
  POSITION,
}

export const enum DragHandleShape {
  CIRCLE = 0,
  PLANE = 1,
}

const StylePlane = {
  plane: {
    stroke: {
      color: 'rgba(255,255,255,0.5)',
      width: 2,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  axisX: {
    stroke: {
      color: 'rgba(255,0,0,0.5)',
      width: 2,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  axisY: {
    stroke: {
      color: 'rgba(0,0,255,0.5)',
      width: 2,
    },
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
};

export const CONTROLLER_DEACTIVATED = 'Deactivated';

export interface Edit3DPointControllerOptions {
  point: Point;
  mapReference: CoordinateReference;
  dragHandleShape?: DragHandleShape;
}
export class Edit3DPointController extends Controller {
  private activePoint: Point | undefined;
  private _styles = Edit3DPointControllerStyles.pathController;
  private _activeGeoHandle: GeoHandle = GeoHandle.NONE;
  private _touchedPoint: Point | undefined = undefined;
  private editMode: EditMode = EditMode.POSITION;
  public onCompleted?: (point: Point) => void;
  public onCancel?: (point: Point) => void;
  public onUpdate?: (point: Point) => void;
  public onDragEnd?: (point: Point) => void;
  private originalPoint: Point | null = null;
  private readonly dragHandleShape: DragHandleShape;
  private readonly _moveHandle: ControllerHandle;
  private readonly _altitudeHandle: ControllerHandle;
  private _deactivated: Subject<boolean> = new Subject();
  private mapReference: CoordinateReference;

  public get deactivated$(): Observable<boolean> {
    return this._deactivated.asObservable();
  }

  public get originalValue(): Point {
    return this.originalPoint;
  }

  public constructor(options: Edit3DPointControllerOptions) {
    super();
    this.mapReference = options.mapReference;

    if (options.point) {
      this.originalPoint = options.point.copy();
      this.activePoint = GeoTools.reprojectPoint3D(this.originalPoint, this.mapReference);
    }

    this._moveHandle = new ControllerHandle();
    this._altitudeHandle = new ControllerHandle();
    this.dragHandleShape =
      typeof options.dragHandleShape === 'undefined' ? DragHandleShape.CIRCLE : DragHandleShape.PLANE;
  }

  public setOriginalPoint(point: Point): void {
    this.originalPoint = point.copy();
    this.activePoint = GeoTools.reprojectPoint3D(this.originalPoint, this.mapReference);
  }

  public updateActivePoint(point: Point): void {
    this.activePoint = GeoTools.reprojectPoint3D(point, this.mapReference);
    this.updateHandles();
  }

  public complete = () => {
    const pathPoint = this.activePoint;
    if (typeof this.onCompleted === 'function' && pathPoint && this.originalPoint && this.originalPoint.reference) {
      const newShape = GeoTools.reprojectPoint3D(pathPoint, this.originalPoint.reference.identifier);
      /* @typescript-eslint/ no-empty-function */
      typeof this.onCompleted(newShape);
    }
  };

  public cancel = () => {
    const pathPoint = this.originalValue && this.originalValue.copy();
    if (typeof this.onCancel === 'function' && pathPoint && this.originalPoint && this.originalPoint?.reference) {
      this.onCancel(pathPoint);
    }
  };

  public onActivate(map: Map) {
    super.onActivate(map);
    this.updateHandles();
  }

  private updateHandles(): void {
    this.updateMoveHandle();
    this.updateAltitudeHandle();
    this.invalidate();
    if (this.map && !this.activePoint) {
      this.map.domNode.style.cursor = 'default';
    }
  }

  private updateMoveHandle(): void {
    const point3D = this.activePoint;

    if (!point3D || !this.map) return;

    const tx = this.map.mapToViewTransformation;
    const interactionTest = (viewPoint: Point) => touchesViewPoint(viewPoint, point3D, tx);

    this._moveHandle.update(point3D, point3D, interactionTest);
  }

  private updateAltitudeHandle(): void {
    const pathPoint = this.activePoint;
    if (!pathPoint || !this.map) {
      return;
    }

    const p3D = pathPoint;
    const up = normalize(p3D);
    const pBottom = add(p3D, scale(up, -100));
    const pTop = add(p3D, scale(up, 50));

    const vector = createPolyline(p3D.reference, [
      [pBottom.x, pBottom.y, pBottom.z],
      [pTop.x, pTop.y, pTop.z],
    ]);

    const pRef = sub(p3D, up) as Point;

    const tx = this.map.mapToViewTransformation;
    const interactionTest = (viewPoint: Point) => touchesAltitudeLine(viewPoint, [p3D, pRef], tx);
    this._altitudeHandle.update(vector, vector, interactionTest);
  }

  public onDeactivate(map: Map): Promise<void> | void {
    this._deactivated.next(true);
    return super.onDeactivate(map);
  }

  override onDraw(geoCanvas: GeoCanvas): void {
    const pathPoint = this.activePoint;
    if (this._touchedPoint) {
      this.drawDragHandle(geoCanvas, this._touchedPoint, this._styles.pointHoverStyle);
    }
    if (!pathPoint) {
      return;
    }

    const geoStyle = this._moveHandle.focused ? this._styles.iconFocusedStyle : this._styles.iconStyle;
    if (this._activeGeoHandle === GeoHandle.MOVE || this._activeGeoHandle === GeoHandle.NONE) {
      this.drawDragHandle(geoCanvas, pathPoint, geoStyle);
    }

    const { focusedShape, defaultShape, focused } = this._altitudeHandle;
    if (this._activeGeoHandle === GeoHandle.ALTITUDE && focusedShape && focused) {
      const colorInverted = invertColor((this._styles.altitudeFocusStyle.stroke as LineStyle).color);
      geoCanvas.drawShape(focusedShape, this._styles.altitudeFocusStyle);
      geoCanvas.drawShape(focusedShape, {
        ...this._styles.altitudeFocusStyle,
        occlusionMode: OcclusionMode.OCCLUDED_ONLY,
        stroke: { ...this._styles.altitudeFocusStyle.stroke, color: colorInverted.rgba },
      });
      this.drawPlane(geoCanvas, pathPoint, StylePlane);
    } else if (defaultShape) {
      const colorInverted = invertColor((this._styles.altitudeStyle.stroke as LineStyle).color);
      geoCanvas.drawShape(defaultShape, this._styles.altitudeStyle);
      geoCanvas.drawShape(defaultShape, {
        ...this._styles.altitudeStyle,
        occlusionMode: OcclusionMode.OCCLUDED_ONLY,
        stroke: { ...this._styles.altitudeStyle.stroke, color: colorInverted.rgba },
      });
    }
  }

  private drawPlane(geoCanvas: GeoCanvas, point: Point, style) {
    const pColor = invertColor(style.plane.stroke.color);
    const xColor = invertColor(style.axisX.stroke.color);
    const yColor = invertColor(style.axisY.stroke.color);

    const planeData = createPlane(point, PLANE_SIZE);
    geoCanvas.drawShape(planeData.plane, style.plane);
    geoCanvas.drawShape(planeData.axisX, style.axisX);
    geoCanvas.drawShape(planeData.axisY, style.axisY);
    geoCanvas.drawShape(planeData.plane, {
      ...style.plane,
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
      stroke: { ...style.plane.stroke, color: pColor.rgba, width: 1 },
    });
    geoCanvas.drawShape(planeData.axisX, {
      ...style.axisX,
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
      stroke: { ...style.axisX.stroke, color: xColor.rgba, width: 1 },
    });
    geoCanvas.drawShape(planeData.axisY, {
      ...style.axisY,
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
      stroke: { ...style.axisY.stroke, color: yColor.rgba, width: 1 },
    });
  }

  private drawDragHandle(geoCanvas: GeoCanvas, point: Point, style: ImageIconStyle) {
    if (this.dragHandleShape === DragHandleShape.CIRCLE) {
      geoCanvas.drawIcon(point, style);
    } else if (this.dragHandleShape === DragHandleShape.PLANE) {
      this.drawPlane(geoCanvas, point, StylePlane);
    }
  }

  private updatePoint(p3D: Vector3): void {
    let pathPoint = this.activePoint;
    if (pathPoint) {
      pathPoint = createPoint(pathPoint.reference, [p3D.x, p3D.y, p3D.z]);
      this.activePoint = pathPoint.copy();
      if (pathPoint && this.originalPoint.reference) {
        const newShape = GeoTools.reprojectPoint3D(pathPoint, this.originalPoint.reference.identifier);
        if (typeof this.onUpdate === 'function') {
          this.onUpdate(newShape);
        }
      }
      this.updateHandles();
    }
  }

  override onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map || this.editMode === EditMode.INACTIVE) {
      return EVENT_IGNORED;
    }

    let result = EVENT_IGNORED;

    const editMode = this.editMode;

    if (editMode === EditMode.POSITION) {
      const handled =
        this.implOnGestureEventForHandle(event, GeoHandle.MOVE) ||
        this.implOnGestureEventForHandle(event, GeoHandle.ALTITUDE);

      const focusedHandle = this._moveHandle.focused
        ? GeoHandle.MOVE
        : this._altitudeHandle.focused
          ? GeoHandle.ALTITUDE
          : GeoHandle.NONE;

      if (handled || this._activeGeoHandle !== focusedHandle) {
        this._activeGeoHandle = focusedHandle;
        this.invalidate();
        result = EVENT_HANDLED;
      }
    }

    const touchedPoint = getTouchedPathPointFeature(event.viewPoint, this.activePoint as Point, this.map);
    if (touchedPoint !== this._touchedPoint) {
      this._touchedPoint = touchedPoint;
      this.invalidate();
      result = EVENT_HANDLED;
    }

    const cursor =
      (this._activeGeoHandle === GeoHandle.MOVE && 'move') ||
      (this._activeGeoHandle === GeoHandle.ALTITUDE && 'row-resize') ||
      (touchedPoint && 'pointer') ||
      'default';

    this.setCursorStyle(cursor);

    return result;
  }

  private implOnGestureEventForHandle(event: GestureEvent, geoHandle: GeoHandle): boolean {
    try {
      if (geoHandle === GeoHandle.MOVE) {
        return this.onGestureEventMove(event);
      } else if (geoHandle === GeoHandle.ALTITUDE) {
        return this.onGestureEventAltitude(event);
      }
    } catch (e) {
      if (!(e instanceof OutOfBoundsError)) {
        throw e;
      }
    }
    return true;
  }

  private onGestureEventAltitude(event: GestureEvent): boolean {
    const pathPoint = this.activePoint;
    if (!pathPoint || !this.map) {
      return false;
    }

    const { type, inputType, viewPoint } = event;
    if (
      type === GestureEventType.MOVE ||
      (inputType === 'touch' && type === GestureEventType.DRAG && !this._altitudeHandle.focused)
    ) {
      return handleInteraction(this._altitudeHandle, viewPoint);
    } else if (type === GestureEventType.DRAG) {
      if (this._altitudeHandle.focused && pathPoint) {
        if (!this._altitudeHandle.interactionFunction) {
          this._altitudeHandle.interactionFunction = linearMovePointInteraction(
            this.map,
            viewPoint,
            pathPoint.copy() as Point,
            normalize(pathPoint),
          );
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const new3D = (this._altitudeHandle.interactionFunction as never)(viewPoint);
        this.updatePoint(new3D as Vector3);
        return true;
      }
    } else if (type === GestureEventType.DRAG_END) {
      if (this._altitudeHandle.focused) {
        this._altitudeHandle.endInteraction();
        return true;
      }
    }
    return false;
  }

  private onGestureEventMove(event: GestureEvent): boolean {
    const pathPoint = this.activePoint;

    if (!pathPoint || !this.map) return false;

    const { type, inputType, viewPoint } = event;

    if (
      type === GestureEventType.MOVE ||
      (type === GestureEventType.DRAG && inputType === 'touch' && !this._moveHandle.focused)
    ) {
      return handleInteraction(this._moveHandle, viewPoint);
    } else if (type === GestureEventType.DRAG) {
      if (this._moveHandle.focused && pathPoint) {
        if (!this._moveHandle.interactionFunction) {
          this._moveHandle.interactionFunction = planarMovePointInteraction(
            this.map,
            viewPoint,
            pathPoint.copy() as Point,
            normalize(pathPoint), // up vector
          );
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const new3D = (this._moveHandle.interactionFunction as unknown)(viewPoint);
        this.updatePoint(new3D as Vector3);
        return true;
      }
    } else if (type === GestureEventType.DRAG_END) {
      this.onDragEnd && this.onDragEnd(pathPoint);
      if (this._moveHandle.focused) {
        this._moveHandle.endInteraction();
        return true;
      }
    }
    return false;
  }

  private setCursorStyle(cursor: string) {
    if (this.map) {
      this.map.domNode.style.cursor = cursor;
    }
  }
}

function touchesAltitudeLine(viewPoint: Point, altitudePoints: [Point, Point], mapToViewTx: Transformation): boolean {
  try {
    const viewPoint1 = mapToViewTx.transform(altitudePoints[0]);
    const viewPoint2 = mapToViewTx.transform(altitudePoints[1]);
    const pointOnLine = projectPointOnLine(viewPoint, viewPoint1, sub(viewPoint2, viewPoint1));
    return distance(viewPoint, pointOnLine) < TOUCH_VERTICAL_THRESHOLD;
  } catch {
    return false;
  }
}

function touchesViewPoint(viewPoint: Vector3, p3D: Point, mapToViewTx: Transformation): boolean {
  try {
    const pView = mapToViewTx.transform(p3D);
    return distance2d(viewPoint, pView) < TOUCH_POINT_THRESHOLD;
  } catch {
    return false;
  }
}

function getTouchedPathPointFeature(viewPoint: Point, feature: Point, map: Map) {
  const pathPoints = [feature];
  return pathPoints?.find((pathPoint) => touchesViewPoint(viewPoint, pathPoint, map.mapToViewTransformation));
}

function handleInteraction(handle: ControllerHandle, viewPoint: Point): boolean {
  const focusedBefore = handle.focused;
  handle.focused = handle.interactsWithMouseFunction ? handle.interactsWithMouseFunction(viewPoint) : false;
  return focusedBefore !== handle.focused;
}

function createPlane(aPoint: Point, distance: number) {
  const point = GeoTools.reprojectPoint3D(aPoint, CRSEnum.CRS_84);
  const GEODESY = createSphericalGeodesy(point.reference);
  const left = GEODESY.interpolate(point, distance, 270, LineType.SHORTEST_DISTANCE);
  const right = GEODESY.interpolate(point, distance, 90, LineType.SHORTEST_DISTANCE);
  const top = GEODESY.interpolate(point, distance, 0, LineType.SHORTEST_DISTANCE);
  const bottom = GEODESY.interpolate(point, distance, 180, LineType.SHORTEST_DISTANCE);
  const topLeft = createPoint(point.reference, [left.x, top.y, point.z]);
  const topRight = createPoint(point.reference, [right.x, top.y, point.z]);
  const bottomLeft = createPoint(point.reference, [left.x, bottom.y, point.z]);
  const bottomRight = createPoint(point.reference, [right.x, bottom.y, point.z]);
  const plane = createPolygon(point.reference, [topLeft, topRight, bottomRight, bottomLeft]);
  const axisY = createPolyline(point.reference, [top, bottom]);
  const axisX = createPolyline(point.reference, [left, right]);
  return {
    axisX,
    axisY,
    plane,
  };
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function invertColor(rgba: string) {
  const rgb = rgba
    .replace(/rgb\(|\)|rgba\(|\)|\s/gi, '')
    .split(',')
    .map((s) => Number(s));
  for (let i = 0; i < rgb.length; i++) {
    rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
  }
  return {
    hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
    rgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    rgba: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${rgb[3]})`,
  };
}
