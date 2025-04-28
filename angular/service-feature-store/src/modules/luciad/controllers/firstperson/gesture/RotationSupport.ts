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
import { Vector3 } from '@luciad/ria/util/Vector3.js';
import { PointCoordinates } from '@luciad/ria/shape/PointCoordinate.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { Map } from '@luciad/ria/view/Map.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { isPointInBounds } from '../util/NavigationUtil';
import { ReferenceType } from '@luciad/ria/reference/ReferenceType.js';
import {
  add,
  cross,
  normalize,
  rotateAroundAxis,
  sub,
  toPoint,
} from '@pages/map/luciad-map/controllers/util/Vector3Util';
import { clamp } from '@pages/map/luciad-map/controllers/util/Math';

const VERTICAL_ORBIT_SCALING = 0.15;
const HORIZONTAL_ORBIT_SCALING = 0.1;
const SELF_ROTATION_SCALING = 0.1;

/**
 * Support class to help with rotating around a pivot or the camera.
 */
export class RotationSupport {
  private readonly _bounds: Bounds;
  private _mouseStart: PointCoordinates | null;

  constructor(bounds: Bounds) {
    this._bounds = bounds;
    this._mouseStart = null;
  }

  /**
   * Rotate the camera around the given pivot point.
   */
  rotateAroundPivot(map: Map, pivot: Vector3, viewPosition: number[], delta?: { x: number; y: number }): void {
    if (this._mouseStart === null) {
      this._mouseStart = viewPosition as PointCoordinates;
      return;
    }

    const [x, y] = viewPosition;
    const [x0, y0] = this._mouseStart;

    const yawDelta = delta ? -(HORIZONTAL_ORBIT_SCALING * delta.x) : HORIZONTAL_ORBIT_SCALING * (x - x0);
    let pitchDelta = delta ? -(VERTICAL_ORBIT_SCALING * delta.y) : VERTICAL_ORBIT_SCALING * (y0 - y);

    this._mouseStart = [x, y];

    const camera = map.camera as PerspectiveCamera;
    const { forward } = camera;
    const { eye, pitch, yaw } = camera.asLookFrom();

    const newPitch = pitch + pitchDelta;
    //clamp the pitch to avoid unexpected flipping once the camera is pointed vertically
    if (newPitch <= -89) {
      pitchDelta = -89 - pitch;
    } else if (newPitch >= 89) {
      pitchDelta = 89 - pitch;
    }

    const diffVec = sub(eye, pivot);
    const up = map.reference.referenceType === ReferenceType.GEOCENTRIC ? normalize(eye) : { x: 0, y: 0, z: 1 };
    const left = cross(up, forward);
    const rotatedHVector = rotateAroundAxis(diffVec, up, -yawDelta);
    const rotatedVVector = rotateAroundAxis(rotatedHVector, left, -pitchDelta);
    const newEye = add(pivot, rotatedVVector);

    const shouldMove = this._bounds ? isPointInBounds(toPoint(map.camera.worldReference, newEye), this._bounds) : true;
    if (shouldMove) {
      map.camera = camera.lookFrom({
        eye: newEye,
        yaw: yaw + yawDelta,
        pitch: pitch + pitchDelta,
        roll: 0,
      });
    }
  }

  /**
   * Rotate the camera around itself
   */
  rotateAroundCameraEye(map: Map, viewPosition: number[], delta?: { x: number; y: number }): void {
    if (this._mouseStart === null) {
      this._mouseStart = viewPosition as PointCoordinates;
      return;
    }

    const [x, y] = viewPosition;
    const [x0, y0] = this._mouseStart;
    const dx = delta ? delta.x * SELF_ROTATION_SCALING : -(x0 - x) * SELF_ROTATION_SCALING;
    const dy = delta ? delta.y * SELF_ROTATION_SCALING : -(y0 - y) * SELF_ROTATION_SCALING;

    const camera = map.camera as PerspectiveCamera;

    const lookFromCamera = camera.asLookFrom();
    lookFromCamera.yaw = (lookFromCamera.yaw + dx) % 360;
    lookFromCamera.pitch = clamp(lookFromCamera.pitch - dy, -89, 89);
    map.camera = camera.lookFrom(lookFromCamera);

    this._mouseStart = [x, y];
  }

  reset() {
    this._mouseStart = null;
  }
}
