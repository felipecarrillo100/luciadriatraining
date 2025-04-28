import { Controller } from '@luciad/ria/view/controller/Controller';
import { Point } from '@luciad/ria/shape/Point';
import { Map } from '@luciad/ria/view/Map';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { createOrientedBox, createPolygon, createPolyline } from '@luciad/ria/shape/ShapeFactory';
import { Vector3 } from '@luciad/ria/util/Vector3';
import {
  add,
  angle,
  cross,
  distance,
  distanceAlongDirection,
  normalize,
  rayPlaneIntersection,
  scale,
  sub,
  toPoint,
} from '../util/Vector3Util';
import { createTransformationFromGeoLocation } from '@luciad/ria/transformation/Affine3DTransformation';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { EVENT_HANDLED, EVENT_IGNORED, HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { calculatePointingDirection } from '../util/PerspectiveCameraUtil';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { ShapeStyle } from '@luciad/ria/view/style/ShapeStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { BOUNDARY_BOX_OUTLINE_COLOR, drawBox } from './orientedbox/OrientedBoxDrawUtil';
import { ModifierType } from '@luciad/ria/view/input/ModifierType';
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent';
import { clamp } from '../util/Math';
import IconImageFactory from '../../utils/iconimagefactory/IconImageFactory';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { OrientedBoxWithAttributes } from './orientedbox/SingleVisibilityBoxSupport';
import {CRSEnum} from '../../interfaces/CRS.enum';

const POINT_STYLE: IconStyle = {
  image: IconImageFactory.circle({
    fill: 'rgba(217, 217, 217, 0.8)',
    width: 18,
    height: 18,
    stroke: 'rgb(255, 255, 255)',
    strokeWidth: 2,
  }),
  width: `${18}px`,
  height: `${18}px`,
};

const POINT_STYLE_HIDDEN: IconStyle = {
  image: IconImageFactory.circle({
    fill: 'rgba(217, 217, 217, 0.2)',
    width: 18,
    height: 18,
    stroke: 'rgb(255, 255, 255)',
    strokeWidth: 2,
  }),
  width: `${18}px`,
  height: `${18}px`,
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

const LINE_STYLE: ShapeStyle = {
  stroke: {
    color: 'rgba(218, 218, 218, 0.8)',
    width: 2,
  },
};

const LINE_STYLE_HIDDEN: ShapeStyle = {
  stroke: {
    color: 'rgba(218, 218, 218, 0.2)',
    width: 2,
  },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

const PLANE_STYLE: ShapeStyle = {
  fill: {
    color: 'rgba(171, 232, 229, 0.4)',
  },
};

const PLANE_STYLE_HIDDEN: ShapeStyle = {
  fill: {
    color: 'rgba(171, 232, 229, 0.1)',
  },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

enum CreationState {
  IDLE,
  CORNER_DEFINED,
  WIDTH_DEFINED,
  PLANE_DEFINED,
}

/**
 * Event that is emitted when a box has been fully defined. The created box is returned together with this event.
 */
export const BOX_CREATED_EVENT = 'BoxCreatedEvent';

/**
 * Max side length in meters, to avoid issues with the fact that oriented boxes do not curve with the earth
 */
const MAX_SIZE = 10_000;

/**
 * Controller used to create an oriented box through 4 clicks. The 4 clicks define:
 * <ol>
 *  <li>A first corner point</li>
 *  <li>A second corner point at the same height as the first one and adjacent to the first corner.</li>
 *  <li>A third corner point at the same height as the last two points, opposite to the first corner.</li>
 *  <li>A fourth corner point straight above or under the third corner point. If the shift modifier key is held down,
 *  the first three points are instead defining the center plane of the bo </li>
 * </ol>
 *
 * Together, these 4 corner points define exactly one oriented box, which is returned when the {@link BOX_CREATED_EVENT}
 * event is emitted.
 */
export class BoxCreateController extends Controller {
  private readonly _eventedSupport: EventedSupport = new EventedSupport([]);

  private _shiftPressed = false;
  private _state: CreationState = CreationState.IDLE;
  private _firstCorner: Point | null = null;
  private _orientation: Vector3 | null = null;
  private _orientationComplement: Vector3 | null = null;
  private _width = 0;
  private _depth = 0;
  private _height = 0;
  private _additionalBoxes: Feature[] = [];

  constructor(additionalBoxes: OrientedBoxWithAttributes[] | null) {
    super();
    if (!additionalBoxes) return;
    for (const box of additionalBoxes) {
      const feature = new Feature(box.shape, { name: box.name, color: box.color }, box.id);
      this._additionalBoxes.push(feature);
    }
  }

  onActivate(map: Map) {
    if (!map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
      throw new Error('Oriented boxes can only be created in a 3D reference');
    }
    super.onActivate(map);
  }

  onKeyEvent(keyEvent: KeyEvent): HandleEventResult {
    if (keyEvent.domEvent instanceof KeyboardEvent) {
      const shiftWasPressed = this._shiftPressed;
      this._shiftPressed = keyEvent.domEvent.getModifierState('Shift');
      if (shiftWasPressed !== this._shiftPressed) {
        this.invalidate();
      }
    }
    return super.onKeyEvent(keyEvent);
  }

  onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }
    this._shiftPressed = event.modifier === ModifierType.SHIFT;
    if (event.type === GestureEventType.MOVE) {
      return this.handleMove(event);
    } else if (event.type === GestureEventType.SINGLE_CLICK_UP) {
      this.handleClick();
    } else if (event.type === GestureEventType.DOUBLE_CLICK) {
      return EVENT_HANDLED;
    }
    return EVENT_IGNORED;
  }

  private handleMove(event: GestureEvent) {
    if (this._state === CreationState.IDLE) {
      this.updateCorner(event.viewPoint);
    } else if (this._state === CreationState.CORNER_DEFINED) {
      this.updateWidth(event.viewPoint);
    } else if (this._state === CreationState.WIDTH_DEFINED) {
      this.updatePlane(event.viewPoint);
    } else if (this._state === CreationState.PLANE_DEFINED) {
      this.updateHeight(event.viewPoint);
    }
    this.invalidate();
    return EVENT_HANDLED;
  }

  private updateCorner(viewPoint: Point) {
    try {
      this._firstCorner = this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(viewPoint);
    } catch (e) {
      if (!(e instanceof OutOfBoundsError)) {
        throw e;
      }
    }
  }

  private updateWidth(viewPoint: Point) {
    if (!this.map || !this._firstCorner) {
      throw new Error('Illegal state');
    }
    const worldPoint = rayPlaneIntersection(
      this.map.camera.eye,
      calculatePointingDirection(this.map, viewPoint),
      this._firstCorner,
      this._firstCorner,
    );
    if (worldPoint) {
      this._width = Math.min(MAX_SIZE, Math.abs(distance(this._firstCorner, worldPoint)));
      this._orientation = normalize(sub(worldPoint, this._firstCorner));
      this._orientationComplement = normalize(cross(this._orientation, this._firstCorner));
    }
  }

  private updatePlane(viewPoint: Point) {
    if (!this.map || !this._firstCorner || !this._orientation || !this._orientationComplement) {
      throw new Error('Illegal state');
    }
    const worldPoint = rayPlaneIntersection(
      this.map.camera.eye,
      calculatePointingDirection(this.map, viewPoint),
      this._firstCorner,
      this._firstCorner,
    );
    if (worldPoint) {
      this._depth = clamp(
        distanceAlongDirection(worldPoint, this._firstCorner, this._orientationComplement),
        -MAX_SIZE,
        MAX_SIZE,
      );
    }
  }

  private updateHeight(viewPoint: Point) {
    if (!this.map || !this._firstCorner || !this._orientation || !this._orientationComplement) {
      throw new Error('Illegal state');
    }
    const right = cross(this.map.camera.forward, this.map.camera.up);
    const normal = normalize(cross(right, this._firstCorner));
    const thirdCorner = add(
      this._firstCorner,
      add(scale(this._orientation, this._width), scale(this._orientationComplement, this._depth)),
    );

    const worldPoint = rayPlaneIntersection(
      this.map.camera.eye,
      calculatePointingDirection(this.map, viewPoint),
      normal,
      thirdCorner,
    );
    if (worldPoint) {
      this._height = clamp(
        distanceAlongDirection(worldPoint, this._firstCorner, this._firstCorner),
        -MAX_SIZE,
        MAX_SIZE,
      );
    }
  }

  private handleClick() {
    if (this._state === CreationState.IDLE && this._firstCorner) {
      this._state = CreationState.CORNER_DEFINED;
    } else if (this._state === CreationState.CORNER_DEFINED && this._width && this._orientation) {
      this._state = CreationState.WIDTH_DEFINED;
    } else if (this._state === CreationState.WIDTH_DEFINED && this._depth) {
      this._state = CreationState.PLANE_DEFINED;
    } else if (this._state === CreationState.PLANE_DEFINED && this._height) {
      this._eventedSupport.emit(BOX_CREATED_EVENT, this.createBox());
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
    return HandleEventResult.EVENT_HANDLED;
  }

  onDraw(geoCanvas: GeoCanvas) {
    if (this._state === CreationState.IDLE && this._firstCorner) {
      geoCanvas.drawIcon(this._firstCorner, POINT_STYLE);
      geoCanvas.drawIcon(this._firstCorner, POINT_STYLE_HIDDEN);
    }
    if (this._state === CreationState.CORNER_DEFINED) {
      const line = this.createLine();
      geoCanvas.drawIcon(line.getPoint(0), POINT_STYLE);
      geoCanvas.drawIcon(line.getPoint(0), POINT_STYLE_HIDDEN);
      geoCanvas.drawIcon(line.getPoint(1), POINT_STYLE);
      geoCanvas.drawIcon(line.getPoint(1), POINT_STYLE_HIDDEN);
      geoCanvas.drawShape(line, LINE_STYLE);
      geoCanvas.drawShape(line, LINE_STYLE_HIDDEN);
    } else if (this._state === CreationState.WIDTH_DEFINED) {
      const plane = this.createPlane();
      geoCanvas.drawIcon(plane.getPoint(0), POINT_STYLE);
      geoCanvas.drawIcon(plane.getPoint(0), POINT_STYLE_HIDDEN);
      geoCanvas.drawIcon(plane.getPoint(1), POINT_STYLE);
      geoCanvas.drawIcon(plane.getPoint(1), POINT_STYLE_HIDDEN);
      geoCanvas.drawIcon(plane.getPoint(2), POINT_STYLE);
      geoCanvas.drawIcon(plane.getPoint(2), POINT_STYLE_HIDDEN);
      geoCanvas.drawShape(plane, PLANE_STYLE);
      geoCanvas.drawShape(plane, PLANE_STYLE_HIDDEN);
    } else if (this._state === CreationState.PLANE_DEFINED) {
      drawBox(geoCanvas, this.createBox(), { withOccludedPart: true });
    }

    for (const feature of this._additionalBoxes) {
      drawBox(geoCanvas, feature.shape as OrientedBox, {
        hightlighted: false,
        withOccludedPart: true,
        color: feature.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
      });
    }
  }

  private createLine() {
    if (!this.map || !this._firstCorner || !this._orientation) {
      throw new Error('Can not create line when map, first corner or orientation is undefined');
    }

    const secondCorner = toPoint(
      this._firstCorner.reference,
      add(this._firstCorner, scale(this._orientation, this._width)),
    );
    return createPolyline(this._firstCorner.reference, [this._firstCorner, secondCorner]);
  }

  private createPlane() {
    if (!this.map || !this._firstCorner || !this._orientation || !this._orientationComplement) {
      throw new Error('Can not create plane when map, first corner or orientation is undefined');
    }
    return createPolygon(this.map.reference, [
      this._firstCorner,
      toPoint(this.map.reference, add(this._firstCorner, scale(this._orientation, this._width))),
      toPoint(
        this.map.reference,
        add(
          this._firstCorner,
          add(scale(this._orientation, this._width), scale(this._orientationComplement, this._depth)),
        ),
      ),
      toPoint(this.map.reference, add(this._firstCorner, scale(this._orientationComplement, this._depth))),
    ]);
  }

  private createBox() {
    if (!this.map || !this._firstCorner || !this._orientation) {
      throw new Error('Can not create box when map, center or orientation is undefined');
    }

    const northFacingCamera = (this.map.camera as PerspectiveCamera).lookFrom({
      eye: this._firstCorner,
      yaw: 0,
      pitch: 0,
      roll: 0,
    });
    let azimuth = -angle(northFacingCamera.forward, this._orientation, northFacingCamera.up) - 90;
    if (this._depth > 0) {
      azimuth = azimuth + 90;
    }

    return createOrientedBox(
      createTransformationFromGeoLocation(this._firstCorner, { azimuth }),
      { x: 0, y: 0, z: this._height < 0 || this._shiftPressed ? -Math.abs(this._height) : 0 },
      {
        x: this._depth < 0 ? this._width : Math.abs(this._depth),
        y: this._depth < 0 ? Math.abs(this._depth) : this._width,
        z: Math.abs(this._shiftPressed ? this._height * 2 : this._height),
      },
    );
  }

  on(
    event: 'Activated' | 'Deactivated' | 'Invalidated' | typeof BOX_CREATED_EVENT,
    callback: ((map: Map) => void) | (() => void) | ((box: OrientedBox) => void),
  ): Handle {
    if (event === BOX_CREATED_EVENT) {
      return this._eventedSupport.on(event, callback);
    }
    return super.on(event as never, callback as never);
  }
}
