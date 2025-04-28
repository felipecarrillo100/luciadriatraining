/*
 *
 * Copyright (c) 1999-2024 Luciad All Rights Reserved.
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
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas.js';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { getNavigationType, getSpeedMultiplier, getZoomFactor, NavigationType } from '../gesture/GestureUtil';
import { PanSupport } from '../gesture/PanSupport';
import { AnchorSupport, Gizmos } from '../anchor/AnchorSupport';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { ReferenceType } from '@luciad/ria/reference/ReferenceType.js';
import { createTopocentricReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { createBounds } from '@luciad/ria/shape/ShapeFactory.js';
import { ZoomSupport } from '../gesture/ZoomSupport';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { RotationSupport } from '../gesture/RotationSupport';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import {
  KeyNavigationSupport,
  NavigationKeysMode,
} from '../keyboard/KeyNavigationSupport';
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent';
import {CRSEnum} from '../../../interfaces/CRS.enum';

// const SCROLL_ZOOM_MULTIPLIER = 0.12;
const SCROLL_ZOOM_MULTIPLIER = 0.25;

const ALLOWED_INTERACTIONS = [
  NavigationType.PAN,
  NavigationType.ZOOM,
  NavigationType.ROTATION,
  NavigationType.FIRST_PERSON_ROTATION,
];

const ALLOWED_ROTATIONS = [NavigationType.ROTATION, NavigationType.FIRST_PERSON_ROTATION];

/**
 * Navigation controller meant to look at 3D objects from close-by, while visualizing navigational anchor points with
 * 3D gizmos.
 * Using this controllers, users can interact with the map in the following ways:
 * <ul>
 *   <li>Panning orthogonally to the camera's forward direction with left mouse drags or one finger touch drags</li>
 *   <li>Rotating around an anchor under your mouse with right mouse drags or two finger touch drags</li>
 *   <li>Rotating around the camera eye with left + right mouse drags or the normal rotation controls with ctrl pressed</li>
 *   <li>Zooming in to and away from an anchor under your mouse with the scroll wheel or pinch gestures</li>
 *   <li>Move horizontally relative to the earth's surface with the arrow or WASD keys (or corresponding keys if you
 *   don't have a QWERTY keyboard) </li>
 *   <li>Move vertically relative to the earth's surface with the Q and E keys (or corresponding keys if you don't have
 *   a QWERTY keyboard) </li>
 * </ul>
 *
 * This controller also guarantees that when it moves the camera, it will always stay in the given bounds.
 * The center of the given bounds is also used to calculate the interaction anchors if none could be found under or
 * close to the mouse position.
 *
 * Note that you _must_ specify a bounds (to the constructor)
 * that is large enough to encompass the asset that you want to navigate around in.
 * If the bounds do not fit around your asset, you are not able to move around in the asset.
 * When working with georeferenced data, note that the bounds should typically be in a topocentric reference,
 * so that they're aligned with the earth surface. This is unlike geocentric (EPSG:4978) bounds, which often stick slanted through the surface.
 * If you do pass in geocentric bounds, these will automatically be converted to a topocentric reference.
 *
 * This controller only works with a PerspectiveCamera.
 */

const LEFT_MOUSE_BUTTON = 0; // cf. https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const RIGHT_MOUSE_BUTTON = 2; // cf. https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button

export class IsolatedRotateZoomPanController extends Controller {
  private readonly _bounds: Bounds;
  private readonly _gizmos: Gizmos;
  private readonly _panSupport: PanSupport;
  private readonly _zoomSupport: ZoomSupport;
  private readonly _rotationSupport: RotationSupport;
  private readonly _keySupport: KeyNavigationSupport;

  private disableController = false;
  private _anchorSupport: AnchorSupport | null = null;
  private _navigationType: NavigationType = NavigationType.NONE;
  private readonly _pointerLockChangeListener: () => void = () => this.onMouseLockEvent();
  private readonly _mouseMoveWhenLockedListener: (unusedEvent) => void = (event) => {
    const viewPosition = [event.layerX, event.layerY];
    const viewPoint = createPoint(null, viewPosition);
    const gestureEvent = {
      type: GestureEventType.DRAG,
      domEvent: event,
      viewPoint,
      viewPosition,
    };
    const newNavigationType = getNavigationType(gestureEvent as GestureEvent, this._navigationType, ALLOWED_ROTATIONS);

    if (this._navigationType !== newNavigationType) {
      this.invalidate();

      if (newNavigationType === NavigationType.NONE) {
        this._panSupport.reset();
        this._rotationSupport.reset();
      } else {
        // compute gizmo anchor when navigation type changed
        this._anchorSupport.computeAnchor(viewPoint, newNavigationType);
        this._gizmos[newNavigationType]?.rescaleForFixedViewSize(this.map, this._anchorSupport.anchor);
      }
    }

    this._navigationType = newNavigationType;

    if (this._navigationType === NavigationType.ROTATION) {
      if (this.draggingButton === RIGHT_MOUSE_BUTTON) {
        this._rotationSupport.rotateAroundCameraEye(this.map, viewPosition, { x: event.movementX, y: event.movementY });
      }
    } else if (this._navigationType === NavigationType.FIRST_PERSON_ROTATION) {
      const { anchor } = this._anchorSupport;

      if (this.draggingButton === RIGHT_MOUSE_BUTTON) {
        this._rotationSupport.rotateAroundPivot(this.map, anchor, viewPosition, {
          x: event.movementX,
          y: event.movementY,
        });
      }

      if (this.draggingButton === LEFT_MOUSE_BUTTON) {
        this._keySupport.updateCameraMouseMovement(this.map, { x: -event.movementX, y: -event.movementY });
      }
    }
  };

  private readonly _shouldLockMouse: boolean = true;
  private hasMouseMoved = false;
  private draggingButton = -1;
  private lockAttempt = false;

  constructor(gizmos: Gizmos, inBounds?: Bounds) {
    super();

    let bounds = inBounds
      ? inBounds.copy()
      : createBounds(getReference(CRSEnum.CRS_84), [-180, 360, -90, 180, -100, 8000]);

    if (bounds.reference?.referenceType === ReferenceType.GEOCENTRIC) {
      // SceneNavigationController bounds are defined in a geocentric reference.
      // These are not aligned to the earth surface and might give issues.
      // Switch to using topocentric navigation bounds
      const topoRef = createTopocentricReference({
        origin: bounds.focusPoint,
      });

      const diagonal = Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2) + Math.pow(bounds.depth, 2));
      bounds = createBounds(topoRef, [-diagonal / 2, diagonal, -diagonal / 2, diagonal, -diagonal / 2, diagonal]);
    }

    this._rotationSupport = new RotationSupport(inBounds ? bounds : undefined);
    this._panSupport = new PanSupport(inBounds ? bounds : undefined);
    this._zoomSupport = new ZoomSupport(inBounds ? bounds : undefined);
    this._bounds = bounds;
    this._gizmos = gizmos;
    this._keySupport = new KeyNavigationSupport(bounds, {
      navigationMode: NavigationKeysMode.CAMERA_FORWARD,
      defaultSpeed: undefined,
      slowerMultiplier: undefined,
      fasterMultiplier: undefined,
    });
  }

  onActivate(map: WebGLMap) {
    super.onActivate(map);
    document.addEventListener('pointerlockchange', this._pointerLockChangeListener, false);

    map.domNode.style.cursor = 'move';

    if (!(map.camera instanceof PerspectiveCamera)) {
      // throw new Error('IsolatedRotateZoomPanController only works with a PerspectiveCamera');
      this.disableController = true;
    }
    this._anchorSupport = new AnchorSupport(map, this._bounds);
    this._keySupport.activate(map);
  }

  onDeactivate(map: WebGLMap) {
    this.unlockMouse();
    super.onDeactivate(map);
    document.removeEventListener('pointerlockchange', this._pointerLockChangeListener, false);
    this._keySupport.deactivate();
  }

  onDraw(geoCanvas: GeoCanvas) {
    const gizmo = this._gizmos[this._navigationType];
    const anchor = this._anchorSupport?.anchor;
    if (gizmo && anchor) {
      geoCanvas.drawIcon3D(anchor, gizmo.style);
    }
  }

  /**
   * Handles key events for the FirstPersonController. It tries to be keyboard-layout agnostic so the same
   * physical keys would work either in QWERTY, AZERTY, QWERTZ or DVORAK layouts.
   *
   * If any relevant key was pressed, it will update the FirstPersonControllerAnimation state and return
   * HandleEventResult.EVENT_HANDLED.
   *
   * For all other cases it will return HandleEventResult.EVENT_IGNORED.
   *
   */
  onKeyEvent(event: KeyEvent): HandleEventResult {
    const target = event.domEvent?.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      // Events on input targets are disregarded.
      return HandleEventResult.EVENT_IGNORED;
    }

    const result = this._keySupport.onKeyEvent(event);
    if (result === HandleEventResult.EVENT_HANDLED && this.map) {
      AnimationManager.removeAnimation(this.map.cameraAnimationKey);
    }

    return result;
  }

  onGestureEvent(event: GestureEvent) {
    if (this.disableController) return HandleEventResult.EVENT_IGNORED;

    if (
      (event.type === GestureEventType.MOVE || event.type === GestureEventType.DRAG) &&
      this._shouldLockMouse &&
      this.draggingButton === RIGHT_MOUSE_BUTTON &&
      this.lockAttempt &&
      !this.isMouseLocked()
    ) {
      this.hasMouseMoved = true;
      this.lockAttempt = false;
      this.lockMouseOnlyAfterMoveConfirmed();
      return HandleEventResult.EVENT_IGNORED;
    }

    if (!this._anchorSupport || !this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }

    const { viewPoint } = event;
    const newNavigationType = getNavigationType(event, this._navigationType, ALLOWED_INTERACTIONS);

    if (this._navigationType !== newNavigationType) {
      this.invalidate();

      if (newNavigationType === NavigationType.NONE) {
        this._panSupport.reset();
        this._rotationSupport.reset();
      } else {
        // compute gizmo anchor when navigation type changed
        this._anchorSupport.computeAnchor(viewPoint, newNavigationType);
        this._gizmos[newNavigationType]?.rescaleForFixedViewSize(this.map, this._anchorSupport.anchor);
      }
    }

    this._navigationType = newNavigationType;

    //stop current camera animations if the user moves
    if (this._navigationType !== NavigationType.NONE) {
      AnimationManager.removeAnimation(this.map.cameraAnimationKey);
    }

    const { anchor } = this._anchorSupport;
    const mouseEvent = event.domEvent as MouseEvent;

    if (event.type === GestureEventType.DOWN) {
      this.map.domNode.focus();

      if (mouseEvent.button === LEFT_MOUSE_BUTTON && mouseEvent.shiftKey) {
        this.lockMouse(LEFT_MOUSE_BUTTON);
        return HandleEventResult.EVENT_IGNORED;
      }

      if (mouseEvent.button === RIGHT_MOUSE_BUTTON) {
        this.lockMouse(RIGHT_MOUSE_BUTTON);
        return HandleEventResult.EVENT_IGNORED;
      }
    } else if (event.type === GestureEventType.UP) {
      this.unlockMouse();
      return HandleEventResult.EVENT_IGNORED;
    }

    if (this._navigationType === NavigationType.PAN) {
      this._panSupport.panCameraOverOrthogonalPlane(this.map, anchor, viewPoint);
    } else if (this._navigationType === NavigationType.ZOOM) {
      this.performZoomAction(event);
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }

    return HandleEventResult.EVENT_HANDLED;
  }

  private performZoomAction = (event: GestureEvent) => {
    const scaleFraction = getZoomFactor(event, SCROLL_ZOOM_MULTIPLIER);
    const zoomScale = scaleFraction * getSpeedMultiplier(event);
    const ghostMode = (event.domEvent as MouseEvent | TouchEvent).ctrlKey;
    // const surfaceCrossed = this._zoomSupport.zoomToAnchor(this.map, anchor, zoomScale, ghostMode);
    const surfaceCrossed = this._zoomSupport.zoomToCenter(this.map, zoomScale, ghostMode);
    // A new zoom anchor will be computed when camera crossed surface or on zooming out
    if (zoomScale < 0 || surfaceCrossed) {
      this._navigationType = NavigationType.NONE;
      this._panSupport.reset();
      this._rotationSupport.reset();
    }
  };

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
   * This function hides the mouse so that the user can freely move around without running into screen boundaries.
   * Note that this function can only be invoked through so called 'engagement events', which are events that are
   * explicit user interactions. In most browsers, there is a further limit that this can only occur on a click event.
   */
  lockMouse(button: number): void {
    if (this._shouldLockMouse) {
      this.draggingButton = button;
      if (!this.isMouseLocked()) {
        this.lockMouseOnlyAfterMoveConfirmed();
      }
    }
  }

  lockMouseOnlyAfterMoveConfirmed() {
    if (this.draggingButton === LEFT_MOUSE_BUTTON) {
      this.map.domNode.requestPointerLock();
      this.lockAttempt = false;
      this.hasMouseMoved = false;
    }
    if (this.draggingButton === RIGHT_MOUSE_BUTTON) {
      if (this.hasMouseMoved) {
        this.map.domNode.requestPointerLock();
        this.lockAttempt = false;
        this.hasMouseMoved = false;
      } else {
        this.lockAttempt = true;
        this.hasMouseMoved = false;
      }
    }
  }

  /**
   * Unlocks the mouse, revealing the mouse pointer.
   */
  unlockMouse(): void {
    this.lockAttempt = false;
    this.hasMouseMoved = false;
    if (this._shouldLockMouse) {
      this.draggingButton = -1;
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
}
