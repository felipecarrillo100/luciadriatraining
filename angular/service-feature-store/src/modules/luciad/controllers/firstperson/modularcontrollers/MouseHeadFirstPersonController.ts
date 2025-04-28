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
import { clamp } from '../../util/Math';
import { Point } from '@luciad/ria/shape/Point';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import * as TransformationFactory from '@luciad/ria/transformation/TransformationFactory';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { Move3DCameraAnimation } from '../../panocontroller/animation/Move3DCameraAnimation';
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

interface DragGestureEvent extends GestureEvent {
  downEvent: GestureEvent;
}

/**
 * The first person controller lets you navigate on the map using a typical FPS control scheme.
 *
 * * Use the mouse to look around.
 * * Use the space bar to fly up.
 * * Use the C key to fly down.
 * * Hold the shift key to speed up.
 *
 */
export class MouseHeadFirstPersonController extends Controller {
  private useAltKey = true;
  private readonly _pointerLockChangeListener: () => void = () => this.onMouseLockEvent();
  private readonly _mouseMoveWhenLockedListener: (unusedEvent) => void = (event) => {
    if (this.useAltKey) {
      if (event.altKey) {
        this.onLockedMouseMoved(event);
      }
    } else {
      this.onLockedMouseMoved(event);
    }
  };

  private readonly _mouseScaling: number;
  private readonly _shouldLockMouse: boolean;
  private readonly _shouldLockMouseOnActivate: boolean;

  private _previousMouseX: number | null = null;
  private _previousMouseY: number | null = null;

  constructor(options: InertialFirstPersonControllerConstructorOptions) {
    super();
    options = options || {};
    this._mouseScaling = options.mouseScaling || 0.2;
    this._shouldLockMouse = options.lockMouse !== false;
    this._shouldLockMouseOnActivate = options.lockMouseOnActivate !== false;
  }

  onActivate(map: Map): void {
    super.onActivate(map);
    document.addEventListener('pointerlockchange', this._pointerLockChangeListener, false);

    if (this._shouldLockMouseOnActivate) {
      this.lockMouse();
    }
  }

  onDeactivate(map: Map): void {
    this.unlockMouse();
    super.onDeactivate(map);
    document.removeEventListener('pointerlockchange', this._pointerLockChangeListener, false);
  }

  /**
   * This function hides the mouse so that the user can freely move around without running into screen boundaries.
   * Note that this function can only be invoked through so called 'engagement events', which are events that are
   * explicit user interactions. In most browsers, there is a further limit that this can only occur on a click event.
   */
  lockMouse(): void {
    if (this._shouldLockMouse) {
      const isPointerLocked = this.isMouseLocked();
      if (!isPointerLocked) {
        this.map.domNode.requestPointerLock();
      }
    }
  }

  /**
   * Unlocks the mouse, revealing the mouse pointer.
   */
  unlockMouse(): void {
    if (this._shouldLockMouse) {
      this.map.domNode.removeEventListener('mousemove', this._mouseMoveWhenLockedListener, false);
      document.exitPointerLock();
    }
  }

  /**
   * Checks if the mouse is currently hidden and locked.
   */
  isMouseLocked(): boolean {
    return this._shouldLockMouse && document.pointerLockElement === this.map?.domNode;
  }

  /**
   * This function is invoked when the mouse is locked or unlocked. It initializes the correct listeners
   * on the map so that relative mouse movements are handled even when the mouse is locked in place and hidden
   * from view.
   */
  onMouseLockEvent(): void {
    const requestedElement = this.map.domNode;
    if (document.pointerLockElement === requestedElement) {
      requestedElement.addEventListener('mousemove', this._mouseMoveWhenLockedListener, false);
    } else {
      this.map.domNode.removeEventListener('mousemove', this._mouseMoveWhenLockedListener, false);
    }
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
    if (event.type === GestureEventType.SINGLE_CLICK_CONFIRMED) {
      this.map.domNode.focus();
    }

    const mouseEvent = event.domEvent as MouseEvent;
    const downMouseEvent = (event as DragGestureEvent).downEvent.domEvent as MouseEvent;

    if (event.type === GestureEventType.DOUBLE_CLICK) {
      if (mouseEvent.button === LEFT_MOUSE_CLICK) {
        this.processDoubleClick(event);

        return HandleEventResult.EVENT_HANDLED;
      } else if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        return HandleEventResult.EVENT_HANDLED;
      }
    } else if (event.type === GestureEventType.DOWN) {
      this.map.domNode.focus();

      if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        this.lockMouse();

        return HandleEventResult.EVENT_HANDLED;
      }
    } else if (event.type === GestureEventType.UP) {
      if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        this.unlockMouse();

        return HandleEventResult.EVENT_HANDLED;
      }
    } else if (event.type === GestureEventType.DRAG) {
      if (downMouseEvent.button === RIGHT_MOUSE_BUTTON) {
        const mouseX = event.viewPosition[0];
        const mouseY = event.viewPosition[1];

        if (this._previousMouseX !== null && this._previousMouseY !== null) {
          this.rotateCamera(mouseX - this._previousMouseX, mouseY - this._previousMouseY);
        }

        this._previousMouseX = mouseX;
        this._previousMouseY = mouseY;

        return HandleEventResult.EVENT_HANDLED;
      } else {
        return HandleEventResult.EVENT_IGNORED;
      }
    } else if (event.type === GestureEventType.DRAG_END) {
      if (downMouseEvent.button === RIGHT_MOUSE_BUTTON) {
        this._previousMouseX = null;
        this._previousMouseY = null;
      }

      return HandleEventResult.EVENT_HANDLED;
    } else if (event.type === GestureEventType.SCROLL) {
      return HandleEventResult.EVENT_IGNORED;
    }

    return HandleEventResult.EVENT_IGNORED;
  }

  /**
   * A special event handler that is invoked when the mouse is locked. This will parse
   * relative mouse movements and translate them into camera rotations.
   */
  onLockedMouseMoved(event: MouseEvent): void {
    if (typeof event.movementY === 'undefined' || typeof event.movementX === 'undefined') {
      return;
    }
    event.preventDefault();
    this.rotateCamera(event.movementX, event.movementY);
  }

  /**
   * Rotates the camera based on a pixel offset
   * @param dx horizontal movement (pixels)
   * @param dy vertical movement (pixels)
   */
  rotateCamera(dx: number, dy: number): void {
    const camera = this.map.camera as PerspectiveCamera;
    const lookFromCamera = camera.asLookFrom();
    lookFromCamera.pitch = clamp(lookFromCamera.pitch - dy * this._mouseScaling, -89, 89);
    lookFromCamera.yaw = lookFromCamera.yaw + dx * this._mouseScaling;
    this.map.camera = camera.lookFrom(lookFromCamera);
  }

  setCameraHeight(point: Point) {
    const newPoint = createPoint(point.reference, [point.x, point.y, point.z + HUMAN_HEIGHT]);
    this.moveCameraToPoint(this.map as WebGLMap, newPoint, 750);
  }

  private processDoubleClick(gestureEvent: GestureEvent) {
    const triggetMapClickEvent = () => {
      if (this.map) {
        try {
          const worldPoint = this.map
            .getViewToMapTransformation(LocationMode.CLOSEST_SURFACE)
            .transform(gestureEvent.viewPoint);
          const pointCrs84 = reprojectPoint3D(worldPoint);
          this.setCameraHeight(pointCrs84);
        } catch {
          console.log('');
        }
      }
    };

    triggetMapClickEvent();
  }

  private moveCameraToPoint(map: WebGLMap, point: Point, duration: number): Promise<void> {
    const lookFrom = (map.camera as PerspectiveCamera).asLookFrom();
    const moveToAnimation = new Move3DCameraAnimation(
      map,
      point,
      lookFrom.yaw,
      0,
      0,
      (map.camera as PerspectiveCamera).fovY,
      duration,
    );
    return AnimationManager.putAnimation(map.cameraAnimationKey, moveToAnimation, false);
  }
}

function reprojectPoint3D(shape: Point, targetProjection?: string) {
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

// interface Input {
//   fast: number;
//   left: number;
//   forward: number;
//   back: number;
//   right: number;
//   up: number;
//   down: number;
// }
