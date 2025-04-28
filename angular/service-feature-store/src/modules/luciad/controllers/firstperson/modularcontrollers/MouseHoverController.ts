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
import { Point } from '@luciad/ria/shape/Point';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { HoverController } from '@luciad/ria/view/controller/HoverController';
import { PickInfo } from '@luciad/ria/view/PickInfo';
import { distance2d } from '../../util/Vector3Util';
import { Vector3 } from '@luciad/ria/util/Vector3';

const HOVER_SENSITIVITY = 1; // pixels around mouse
const THROTTLE_DISTANCE = 10; // px (999 is equal to disable throttling)
const SKIP_THROTTLING_TIME = 100; // ms. If it takes more than this time to move the mouse, we don't throttle

export class MouseHoverController extends HoverController {
  private _lastViewPoint: Vector3 = { x: 0, y: 0 } as Vector3;
  private _lastPickTime = 0;

  // If the mouse moves too fast, we throttle the hover event.
  // It prevents calling this.map?.pickAt() too often
  override getCandidates(viewPoint: Point): PickInfo[] {
    if (
      distance2d(this._lastViewPoint, viewPoint) > THROTTLE_DISTANCE &&
      Date.now() - this._lastPickTime < SKIP_THROTTLING_TIME
    ) {
      this.saveLastViewPoint(viewPoint);
      return [];
    }

    this.saveLastViewPoint(viewPoint);
    return this.pickFeaturesUnderCursor(viewPoint);
  }

  private pickFeaturesUnderCursor(viewPoint: Point | null): PickInfo[] {
    const pickArray = this.map?.pickAt(viewPoint.x, viewPoint.y, HOVER_SENSITIVITY); // takes 6-20ms on Helgoland
    const pick = pickArray.find((a) => a.layer instanceof FeatureLayer);
    const pickedObject = pick?.objects[0];

    if (!pick && !pickedObject?.shape) return [];

    const selectedFeatures = {
      layer: pick.layer as FeatureLayer,
      objects: [pickedObject],
    };

    return [selectedFeatures];
  }

  private saveLastViewPoint(viewPoint: Point): void {
    this._lastViewPoint = viewPoint;
    this._lastPickTime = Date.now();
  }
}
