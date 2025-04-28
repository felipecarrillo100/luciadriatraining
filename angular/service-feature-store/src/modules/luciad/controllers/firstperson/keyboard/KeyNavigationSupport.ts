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
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { KeyEventType } from '@luciad/ria/view/input/KeyEventType.js';
import { Map as RIAMap } from '@luciad/ria/view/Map.js';
import { Vector3 } from '@luciad/ria/util/Vector3.js';
import { add, cross, invert, normalize, scale, toPoint } from '@pages/map/luciad-map/controllers/util/Vector3Util';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { ReferenceType } from '@luciad/ria/reference/ReferenceType.js';
import { isPointInBounds } from '../util/NavigationUtil';

// For Dimitar to adapt currently they are equal. Value between 0 and 1 go slower,  value higher than 1 goes faster
const UP_DOWN_MULTIPLIER = 1;
const LEFT_RIGHT_MULTIPLIER = 0.35;

// For Dimitar to adapt use to Invert the direction of the movement
const INVERT_MOUSE_LEFT_RIGHT = true;
const INVERT_MOUSE_UP_DOWN = true;

// Adapts the sensitivity of the mouse movement
const MouseSensitivityMultiplier = 0.25;

const verticalUp = (camera: PerspectiveCamera) => {
  if (camera.worldReference.referenceType === ReferenceType.GEOCENTRIC) {
    return normalize(camera.eye);
  }
  return { x: 0, y: 0, z: 1 };
};
const verticalDown = (camera: PerspectiveCamera) => invert(verticalUp(camera));
const horizontalRight = (camera: PerspectiveCamera) => normalize(cross(camera.forward, verticalUp(camera)));
const horizontalLeft = (camera: PerspectiveCamera) => invert(horizontalRight(camera));
const horizontalForward = (camera: PerspectiveCamera) => normalize(cross(verticalUp(camera), horizontalRight(camera)));
const horizontalBack = (camera: PerspectiveCamera) => invert(horizontalForward(camera));

const forward = (camera: PerspectiveCamera) => camera.forward;
const back = (camera: PerspectiveCamera) => invert(camera.forward);
const right = (camera: PerspectiveCamera) => cross(camera.forward, camera.up);
const left = (camera: PerspectiveCamera) => invert(right(camera));
const up = (camera: PerspectiveCamera) => camera.up;
const down = (camera: PerspectiveCamera) => invert(camera.up);

/**
 * A mapping of key codes to functions that return a vector of length 1 that represent a direction from a given
 * camera
 */
type KeyMapping = Map<string, (camera: PerspectiveCamera) => Vector3>;

const mappingModeForward: KeyMapping = new Map([
  ['ArrowUp', forward],
  ['ArrowDown', back],
  ['ArrowRight', right],
  ['ArrowLeft', left],
  ['KeyW', forward],
  ['KeyS', back],
  ['KeyD', right],
  ['KeyA', left],
  ['KeyE', up],
  ['KeyQ', down],
]);

const mappingModeTangent: KeyMapping = new Map([
  ['ArrowUp', horizontalForward],
  ['ArrowDown', horizontalBack],
  ['ArrowRight', horizontalRight],
  ['ArrowLeft', horizontalLeft],
  ['KeyW', horizontalForward],
  ['KeyS', horizontalBack],
  ['KeyD', horizontalRight],
  ['KeyA', horizontalLeft],
  ['KeyE', verticalUp],
  ['KeyQ', verticalDown],
]);

const DEFAULT_MOVEMENT_SPEED = 5; // 5m/s = 18 km/h
const DEFAULT_SLOWDOWN_MULTIPLIER = 0.25;
const DEFAULT_SPEEDUP_MULTIPLIER = 3;

/**
 * The mode of navigation using keys.
 * The navigation keys are
 * <ul>
 *   <li>Arrow up or 'W': forward</li>
 *   <li>Arrow down or 'S': backwards</li>
 *   <li>Arrow left or 'A': left</li>
 *   <li>Arrow right or 'D': right</li>
 *   <li>'E': up</li>
 *   <li>'Q': down</li>
 * </ul>
 * We only check the key's position, not the actual character, so if you don't have a QWERTY layout, you can have other
 * characters mapped to the navigation directions.
 */
export enum NavigationKeysMode {
  /**
   * In this mode, you can use the horizontal movement keys to move in the plane defined by the camera's forward and
   * right vector.
   * The Q and E buttons map to movement along the camera's up direction.
   */
  CAMERA_FORWARD = 'CAMERA',
  /**
   * In this mode, you can use the horizontal movement keys to move parallel to the globe's surface.
   * The Q and E buttons map to vertical movement, lower down or higher up.
   */
  TANGENT_FORWARD = 'TANGENT',
}

interface NavigationKeysOptions {
  /**
   * The way how navigation keys are mapped to camera translations
   */
  navigationMode: NavigationKeysMode;

  /**
   * The default movement speed of this support in meters per seconds, the default is 5m/s
   */
  defaultSpeed?: number;

  /**
   * The multiplier applied to the default movement speed of this support when shift is pressed in meters per seconds,
   * the default is 0.25
   */
  slowerMultiplier?: number;

  /**
   * The multiplier applied to the default movement speed of this support when space is pressed in meters per seconds,
   * the default is 3
   */
  fasterMultiplier?: number;
}

/**
 * Support for first person view controllers that operates fully in cartesian space.
 */
export class KeyNavigationSupport {
  private readonly _downKeys = new Set<string>();
  private readonly _bounds: Bounds;
  private readonly _keyMapping: KeyMapping;
  private readonly _defaultSpeed: number;
  private _speedMultiplier = 1;
  private _map: RIAMap | null = null;
  private _timeStamp = 0;
  private _slowerMultiplier: number;
  private _fasterMultiplier: number;

  constructor(
    bounds: Bounds | undefined | null,
    { defaultSpeed, navigationMode, slowerMultiplier, fasterMultiplier }: NavigationKeysOptions,
  ) {
    this._bounds = bounds;
    this._defaultSpeed = defaultSpeed || DEFAULT_MOVEMENT_SPEED;
    this._slowerMultiplier = slowerMultiplier || DEFAULT_SLOWDOWN_MULTIPLIER;
    this._fasterMultiplier = fasterMultiplier || DEFAULT_SPEEDUP_MULTIPLIER;
    this._keyMapping = navigationMode === NavigationKeysMode.CAMERA_FORWARD ? mappingModeForward : mappingModeTangent;
  }

  /**
   * Initializes this support and starts the update loop.
   * Call this when the controller using this is activated
   */
  activate(map: RIAMap) {
    this._timeStamp = performance.now();
    this._map = map;
    this.update();
  }

  /**
   * Deactivates this support and stops the update loop.
   * Call this when the controller using this is deactivated
   */
  deactivate() {
    this._map = null;
    this._downKeys.clear();
  }

  /**
   * Handles the given key event and returns whether the event was handled or ignored.
   * Call this when the controller using this needs to handle a key event.
   */
  onKeyEvent(keyEvent: KeyEvent): HandleEventResult {
    const event = keyEvent.domEvent;
    if (!event || !this._map) {
      return HandleEventResult.EVENT_IGNORED;
    }

    // const isFaster = event.shiftKey;
    // // const isSlower = event.code === 'Space' && keyEvent.type === KeyEventType.DOWN;
    // const isSlower = event.ctrlKey;

    const isFaster = false;
    const isSlower = false;

    // Handle ALT buttons that caused the bug
    if (event.code === 'AltLeft' || event.code === 'AltRight') {
      return HandleEventResult.EVENT_HANDLED;
    }

    this._speedMultiplier = isFaster === isSlower ? 1 : isFaster ? this._fasterMultiplier : this._slowerMultiplier;

    if (!this._keyMapping.has(event.code)) {
      return HandleEventResult.EVENT_IGNORED;
    }

    if (keyEvent.type === KeyEventType.DOWN) {
      if (!this._downKeys.has(event.code)) {
        this._downKeys.add(event.code);
        return HandleEventResult.EVENT_HANDLED;
      }
    } else if (keyEvent.type === KeyEventType.UP) {
      if (this._downKeys.has(event.code)) {
        this._downKeys.delete(event.code);
        return HandleEventResult.EVENT_HANDLED;
      }
    }
    return HandleEventResult.EVENT_IGNORED;
  }

  private update() {
    // End looping when the map is destroyed (RIA-4243)
    if (!this._map || !this._map.mapNavigator) {
      return;
    }
    const newTimeStamp = performance.now();
    const deltaTime = newTimeStamp - this._timeStamp;
    this._timeStamp = newTimeStamp;

    this.updateCamera(this._map, deltaTime);
    requestAnimationFrame(() => this.update());
  }

  private updateCamera(map: RIAMap, deltaTime: number): void {
    // This check is important, if we keep updating the camera, the map will never trigger the "idle" event
    if (this._downKeys.size === 0) {
      return;
    }

    let camera = map.camera as PerspectiveCamera;
    for (const key of this._downKeys.keys()) {
      const translateFunc = this._keyMapping.get(key);
      if (translateFunc) {
        const directionScale =
          translateFunc === forward || translateFunc === back ? UP_DOWN_MULTIPLIER : LEFT_RIGHT_MULTIPLIER;
        const distance = (directionScale * this._defaultSpeed * this._speedMultiplier * deltaTime) / 1000;
        const translationVector = scale(normalize(translateFunc(camera)), distance);
        const newEye = add(camera.eye, translationVector);

        const shouldMove = this._bounds ? isPointInBounds(toPoint(camera.worldReference, newEye), this._bounds) : true;

        if (shouldMove) {
          camera = camera.copyAndSet({ eye: newEye });
        }
      }
    }

    map.camera = camera;
  }

  public updateCameraMouseMovement(map: RIAMap, movement: { x: number; y: number }): void {
    let camera = map.camera as PerspectiveCamera;
    const axes = ['x', 'y'];
    for (const axis of axes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { translateFunc, value } = this.translateMovement(axis as any, movement);
      if (translateFunc) {
        const directionScale =
          translateFunc === forward || translateFunc === back ? UP_DOWN_MULTIPLIER : LEFT_RIGHT_MULTIPLIER;
        const distance = (directionScale * this._defaultSpeed * MouseSensitivityMultiplier * value) / 1000;
        const translationVector = scale(normalize(translateFunc(camera)), distance);
        const newEye = add(camera.eye, translationVector);

        const shouldMove = this._bounds ? isPointInBounds(toPoint(camera.worldReference, newEye), this._bounds) : true;

        if (shouldMove) {
          camera = camera.copyAndSet({ eye: newEye });
        }
      }
    }

    map.camera = camera;
  }

  private translateMovement(axis: 'x' | 'y', movement: { x: number; y: number }) {
    const step = 10;
    const x = (INVERT_MOUSE_LEFT_RIGHT ? -1 : 1) * Math.floor(movement.x / 5);
    const y = (INVERT_MOUSE_UP_DOWN ? -1 : 1) * Math.floor(movement.y / 10);
    if (axis === 'x') {
      if (x > 0) {
        return { translateFunc: this._keyMapping.get('ArrowRight'), value: Math.abs(step * x) };
      } else if (x < 0) {
        return { translateFunc: this._keyMapping.get('ArrowLeft'), value: Math.abs(step * x) };
      } else {
        return { translateFunc: this._keyMapping.get('ArrowRight'), value: Math.abs(step * x) };
      }
    }
    if (axis === 'y') {
      if (y > 0) {
        return { translateFunc: this._keyMapping.get('ArrowDown'), value: Math.abs(step * y) };
      } else if (y < 0) {
        return { translateFunc: this._keyMapping.get('ArrowUp'), value: Math.abs(step * y) };
      } else {
        return { translateFunc: this._keyMapping.get('ArrowDown'), value: Math.abs(step * y) };
      }
    }
  }
}
