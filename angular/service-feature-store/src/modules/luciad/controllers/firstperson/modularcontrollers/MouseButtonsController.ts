/*
 *
 * Copyright (c) 1999-2023 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType.js';
import { Map } from '@luciad/ria/view/Map.js';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { Point } from '@luciad/ria/shape/Point';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import * as TransformationFactory from '@luciad/ria/transformation/TransformationFactory';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { Move3DCameraAnimation } from '../../panocontroller/animation/Move3DCameraAnimation';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { SurfaceCalculations, SurfaceInfo } from '../../util/SurfaceCalculations';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { ContextMenu } from '@luciad/ria/view/ContextMenu';
import {CRSEnum} from '../../../interfaces/CRS.enum';

export interface InertialFirstPersonControllerConstructorOptions {
  /**
   * A number that indicates how mouse movements should scale for looking around
   */
  mouseScaling?: number;
  /**
   * True if the mouse should be locked when this controller is activated; false otherwise
   */
  lockMouseOnActivate?: boolean;

  /**
   * True if the mouse should be locked; false if it should never be locked
   */
  lockMouse?: boolean;
}

const HUMAN_HEIGHT = 1.7;
const LEFT_MOUSE_CLICK = 0;
const RIGHT_MOUSE_BUTTON = 2; // cf. https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
export const FEATURE_CLICKED = 'FeatureClicked';
export const MAP_CLICKED = 'MapClicked';
export const OPEN_CONTEXTMENU_EVENT = 'OpenContextMenuEvent';

const PICK_SENSITIVITY = 1; // pixels around mouse
const PICK_SENSITIVITY_CONTEXT_MENU = 2;
export interface ContextMenuOnClosestSurfaceControllerEvent {
  position: number[];
  worldPoint: Point;
  viewPoint: Point | null;
  timestamp: number;
  layer?: FeatureLayer | null;
  feature?: Feature | null;
}

export type ContextMenuGenerator = (e: ContextMenuOnClosestSurfaceControllerEvent) => ContextMenu;

/**
 * The first person controller lets you navigate on the map using a typical FPS control scheme.
 *
 * * Use the mouse to look around.
 * * Use the space bar to fly up.
 * * Use the C key to fly down.
 * * Hold the shift key to speed up.
 *
 */
export class MouseButtonsController extends Controller {
  private readonly _mouseScaling: number;
  private readonly _shouldLockMouse: boolean;
  private readonly eventedSupport = new EventedSupport([OPEN_CONTEXTMENU_EVENT, FEATURE_CLICKED, MAP_CLICKED], true);

  constructor(options: InertialFirstPersonControllerConstructorOptions) {
    super();
    options = options || {};
    this._mouseScaling = options.mouseScaling || 0.2;
    this._shouldLockMouse = options.lockMouse !== false;
  }

  onActivate(map: Map): void {
    super.onActivate(map);
  }

  onDeactivate(map: Map): void {
    super.onDeactivate(map);
  }

  /**
   * Handles the following events:
   *
   * * SINGLE_CLICK_CONFIRMED: When you click on the mouse, it will lock the mouse.
   * * DRAG: Will try to lock the mouse. If it could not lock the cursor due to browser restrictions,
   *         it will instead rotate the camera without locking the mouse as a fallback.
   * * DRAG_END: Will unlock the mouse, if it was locked.
   * * SCROLL: Has no result, but blocks the default from controller from using this as a zoom operation.
   *
   */
  onGestureEvent(event: GestureEvent): HandleEventResult {
    const mouseEvent = event.domEvent as MouseEvent;

    if (event.type === GestureEventType.SINGLE_CLICK_CONFIRMED) {
      this.map.domNode.focus();

      if (mouseEvent.button === LEFT_MOUSE_CLICK) {
        this.handleSingleClickEvent(event);
      }
    }

    if (event.type === GestureEventType.CONTEXT_MENU || event.type === GestureEventType.SINGLE_CLICK_CONFIRMED) {
      if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        this.handleContextMenuEvent(event);
        return HandleEventResult.EVENT_HANDLED;
      }
    }

    if (event.type === GestureEventType.DOUBLE_CLICK) {
      if (mouseEvent.button === LEFT_MOUSE_CLICK) {
        return this.processDoubleClick(event);
      } else if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        return HandleEventResult.EVENT_HANDLED;
      }
    } else if (event.type === GestureEventType.SCROLL) {
      return HandleEventResult.EVENT_IGNORED;
    }

    return HandleEventResult.EVENT_IGNORED;
  }

  setCameraHeight(point: Point) {
    const newPoint = createPoint(point.reference, [point.x, point.y, point.z + HUMAN_HEIGHT]);
    this.moveCameraToPoint(this.map as WebGLMap, newPoint, 750);
  }

  private processDoubleClick(gestureEvent: GestureEvent): HandleEventResult {
    if (this.map && this.map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
      const surfaceInfo: SurfaceInfo = SurfaceCalculations.surfacePlane(this.map as WebGLMap, gestureEvent.viewPoint);

      if (surfaceInfo) {
        const feature = this.pickFeaturesAtEventPoint(gestureEvent, PICK_SENSITIVITY);

        if (feature) return HandleEventResult.EVENT_HANDLED;

        this.moveCameraToPoint(this.map as WebGLMap, surfaceInfo.camera, 750, surfaceInfo);
      }
    }

    return HandleEventResult.EVENT_IGNORED;
  }

  private moveCameraToPoint(map: WebGLMap, point: Point, duration: number, surfaceInfo?: SurfaceInfo): Promise<void> {
    const lookFrom = (map.camera as PerspectiveCamera).asLookFrom();
    const moveToAnimation = new Move3DCameraAnimation(
      map,
      point,
      surfaceInfo ? surfaceInfo.yaw : lookFrom.yaw,
      0,
      0,
      (map.camera as PerspectiveCamera).fovY,
      duration,
    );
    return AnimationManager.putAnimation(map.cameraAnimationKey, moveToAnimation, false);
  }

  private reprojectPoint3D(shape: Point, targetProjection?: string) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetProjection = targetProjection ? targetProjection : CRSEnum.EPSG_4326;
    targetProjection = targetProjection === CRSEnum.CRS_84 ? CRSEnum.EPSG_4326 : targetProjection;
    const sourceProjection =
      shape.reference?.name === 'WGS_1984' && shape.reference.identifier.includes('CRS84')
        ? CRSEnum.EPSG_4326
        : shape.reference?.identifier;
    const targetReference = getReference(targetProjection);
    if (sourceProjection === targetProjection) {
      return shape;
    } else {
      const transformer = TransformationFactory.createTransformation(
        shape.reference as CoordinateReference,
        targetReference,
      );
      return transformer.transform(shape);
    }
  }

  private handleContextMenuEvent(event: GestureEvent) {
    const matchFound = this.pickFeaturesAtEventPoint(event, PICK_SENSITIVITY_CONTEXT_MENU);
    let newPoint = null;
    try {
      newPoint = this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(event.viewPoint);
    } catch (e) {
      if (!(e instanceof OutOfBoundsError)) {
        throw e;
      }
    }
    this.map.domNode.style.cursor = '';
    this.eventedSupport.emit(OPEN_CONTEXTMENU_EVENT, {
      timestamp: Date.now(),
      worldPoint: newPoint,
      viewPoint: event.viewPoint,
      position: event.clientPosition,
      layer: matchFound ? matchFound.layer : null,
      feature: matchFound ? matchFound.feature : null,
    } as ContextMenuOnClosestSurfaceControllerEvent);
    this.invalidate();
  }

  private pickFeaturesAtEventPoint(gestureEvent: GestureEvent, pickSensitivity = PICK_SENSITIVITY) {
    if (this.map) {
      const pickArray = this.map?.pickAt(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, pickSensitivity);
      const pick = pickArray.find((a) => a.layer instanceof FeatureLayer);
      if (pick && pick.layer instanceof FeatureLayer) {
        const pickedObject = pick.objects[0];
        return { layer: pick.layer, feature: pickedObject };
      }
    }

    return null;
  }

  override on(
    event:
      | 'Activated'
      | 'Deactivated'
      | 'Invalidated'
      | typeof OPEN_CONTEXTMENU_EVENT
      | typeof FEATURE_CLICKED
      | typeof MAP_CLICKED,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any,
  ): Handle {
    if (event === MAP_CLICKED) {
      return this.eventedSupport.on(event, callback, context);
    } else if (event === FEATURE_CLICKED) {
      return this.eventedSupport.on(event, callback, context);
    } else if (event === OPEN_CONTEXTMENU_EVENT) {
      return this.eventedSupport.on(OPEN_CONTEXTMENU_EVENT, callback);
    } else if (event === 'Activated') {
      return super.on(event, callback);
    } else if (event === 'Deactivated') {
      return super.on(event, callback);
    } else {
      return super.on(event, callback, context);
    }
  }

  private handleSingleClickEvent(gestureEvent: GestureEvent) {
    const triggerMapClickEvent = () => {
      if (this.map) {
        try {
          const worldPoint = this.map
            .getViewToMapTransformation(LocationMode.CLOSEST_SURFACE)
            .transform(gestureEvent.viewPoint);
          const pointCrs84 = this.reprojectPoint3D(worldPoint);
          this.eventedSupport.emit(MAP_CLICKED, pointCrs84, worldPoint, gestureEvent);
        } catch (e) {
          console.log(e);
        }
      }
    };
    const pickArray = this.map?.pickAt(gestureEvent.viewPoint.x, gestureEvent.viewPoint.y, PICK_SENSITIVITY);
    const pick = pickArray.find((a) => a.layer instanceof FeatureLayer);
    if (pick && pick.layer instanceof FeatureLayer) {
      const pickedObject = pick.objects[0];
      if (pickedObject.shape /*&& pickedObject.shape.type === ShapeType.POINT*/) {
        this.eventedSupport.emit(FEATURE_CLICKED, pickedObject, pick.layer, gestureEvent);
      } else {
        triggerMapClickEvent();
      }
    } else {
      triggerMapClickEvent();
    }
    return null;
  }
}
