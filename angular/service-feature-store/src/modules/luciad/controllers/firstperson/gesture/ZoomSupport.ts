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
import { Map } from '@luciad/ria/view/Map.js';
import { Point } from '@luciad/ria/shape/Point.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { isPointInBounds } from '../util/NavigationUtil';
import { distance, interpolateVectors, toPoint } from '@pages/map/luciad-map/controllers/util/Vector3Util';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager';
import { Move3DCameraAnimation } from '@pages/map/luciad-map/controllers/panocontroller/animation/Move3DCameraAnimation';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';

const MIN_DISTANCE_TO_SURFACE = 0.5;
// const ANIMATION_DURATION = 320;

/**
 * Support class to help with zooming towards and behind a given anchor point
 */
export class ZoomSupport {
  private readonly _bounds: Bounds;

  constructor(bounds?: Bounds) {
    this._bounds = bounds;
  }

  /**
   * Zoom towards (fraction > 0) or away from (fraction < 0) the given anchor.
   * The anchor will stay at the same view position on the map.
   * If forceTrue is set to false, the camera will stay at a fixed distance from the anchor.
   * Otherwise, once the camera is close enough, it will zoom behind the anchor.
   * @return true if the surface was crossed (in ghost mode), otherwise false.
   */
  zoomToAnchor(map: Map, anchor: Point, fraction: number, forceThrough: boolean): boolean {
    const { eye } = map.camera;
    const distanceToAnchor = distance(anchor, eye);
    const newDistance = distanceToAnchor * (1 - fraction);
    let surfaceCrossed = false;

    if (fraction > 0 && newDistance < MIN_DISTANCE_TO_SURFACE) {
      if (forceThrough) {
        fraction = 2; // fly through the anchor (surface)
        surfaceCrossed = true;
      } else {
        // refuse to cross surface - move forward to the min distance
        fraction = 1 - MIN_DISTANCE_TO_SURFACE / distanceToAnchor;
      }
    }

    const newEye = interpolateVectors(eye, anchor, fraction);

    const shouldMove = this._bounds ? isPointInBounds(toPoint(map.camera.worldReference, newEye), this._bounds) : true;
    if (shouldMove) {
      //  map.camera = map.camera.copyAndSet({ eye: newEye });

      const camera = map.camera.copyAndSet({ eye: newEye });
      const lookFrom = camera.asLookFrom();

      const moveToAnimation = new Move3DCameraAnimation(
        map,
        camera.eyePoint,
        lookFrom.yaw,
        lookFrom.pitch,
        lookFrom.roll,
        (map.camera as PerspectiveCamera).fovY,
        500,
      );

      AnimationManager.putAnimation(map.cameraAnimationKey, moveToAnimation, false);
    }

    return surfaceCrossed;
  }

  zoomToCenter(map: Map, fraction: number, forceThrough: boolean): boolean {
    const domNode = map.domNode;
    const anchorScreen = createPoint(undefined, [domNode.clientWidth / 2, domNode.clientHeight / 2]);
    const anchorCenter = map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(anchorScreen);
    return this.zoomToAnchor(map, anchorCenter, fraction, forceThrough);
  }
}
