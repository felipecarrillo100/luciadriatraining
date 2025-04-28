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
import { Point } from '@luciad/ria/shape/Point.js';
import { LocationMode } from '@luciad/ria/transformation/LocationMode.js';
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { DragEvent } from '@luciad/ria/view/input/DragEvent.js';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType.js';
import { Scroller } from './Scroller';

const LEFT_MOUSE_BUTTON = 0; // cf. https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button

const NUMBER_OF_MOUSE_POSITIONS_TO_TRACK = 5;
const INERTIA_DRAG_RELEASE_THRESHOLD = 25;
/**
 * This controller uses the regular high-level MapNavigator API to add inertia to the regular Camera Controller
 * @constructor
 */
export const NB_SAMPLES = 200;
export const SPLINE_POSITION = new Array(NB_SAMPLES + 1);
const START_TENSION = 0.5;
const INFLEXION = 0.15; // Tension lines cross at (INFLEXION, 1)
const END_TENSION = 1.0;
const P1 = START_TENSION * INFLEXION;
const P2 = 1.0 - END_TENSION * (1.0 - INFLEXION);

let x_min = 0.0;
for (let i = 0; i < NB_SAMPLES; i++) {
  const alpha = i / NB_SAMPLES;

  let x_max = 1.0;
  let x, tx, coef;

  while (true) {
    x = x_min + (x_max - x_min) / 2.0;
    coef = 3.0 * x * (1.0 - x);
    tx = coef * ((1.0 - x) * P1 + x * P2) + x * x * x;
    if (Math.abs(tx - alpha) < 1e-5) {
      break;
    }
    if (tx > alpha) {
      x_max = x;
    } else {
      x_min = x;
    }
  }
  SPLINE_POSITION[i] = coef * ((1.0 - x) * START_TENSION + x) + x * x * x;
}
SPLINE_POSITION[NB_SAMPLES] = 1.0;

export function SPLINE_EASE(t: number): number {
  const index = Math.floor(NB_SAMPLES * t);
  if (index < NB_SAMPLES) {
    const t_inf = index / NB_SAMPLES;
    const t_sup = (index + 1) / NB_SAMPLES;
    const d_inf = SPLINE_POSITION[index];
    const d_sup = SPLINE_POSITION[index + 1];
    const velocityCoef = (d_sup - d_inf) / (t_sup - t_inf);
    return d_inf + (t - t_inf) * velocityCoef;
  }
  return t;
}

export class PanInertiaController extends Controller {
  private _isDragging: boolean;
  private _dragStart: null | Point;
  private _dragPoints: { x: number; y: number; time: number }[];
  private _scroller: Scroller;

  constructor() {
    super();
    this._isDragging = false;
    this._dragStart = null;
    this._dragPoints = [];
    this._scroller = new Scroller();
  }

  onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }

    // Workaround to make up for the inconsistent values for domEvent.button while dragging
    let button = LEFT_MOUSE_BUTTON;
    if (typeof (event.domEvent as MouseEvent).button !== 'undefined') {
      const domEvent = event.domEvent as MouseEvent;
      const downEvent = (event as unknown as DragEvent).downEvent;

      if (domEvent.button !== LEFT_MOUSE_BUTTON) {
        button = domEvent.button;
      } else if (downEvent && (downEvent.domEvent as MouseEvent).button !== 0) {
        button = (downEvent.domEvent as MouseEvent).button;
      }
    }

    const isLeftClick = button === LEFT_MOUSE_BUTTON;

    if (!isLeftClick) {
      return HandleEventResult.EVENT_IGNORED;
    }

    if (event.type === GestureEventType.DRAG) {
      if (!this._isDragging) {
        this._isDragging = true;
        this._dragStart = this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(event.viewPoint);
      }

      if (this._isDragging) {
        this._dragPoints.push({
          x: event.viewPoint.x,
          y: event.viewPoint.y,
          time: Date.now(),
        });

        if (this._dragPoints.length > NUMBER_OF_MOUSE_POSITIONS_TO_TRACK) {
          this._dragPoints.splice(0, 1);
        }

        this.map.mapNavigator.pan({
          targetLocation: this._dragStart as Point,
          toViewLocation: event.viewPoint,
        });
      }

      return HandleEventResult.EVENT_HANDLED;
    }

    if (event.type === GestureEventType.DRAG_END) {
      this._isDragging = false;
      const time = Date.now();

      if (
        this._dragPoints.length > 3 &&
        time - this._dragPoints[this._dragPoints.length - 1].time < INERTIA_DRAG_RELEASE_THRESHOLD
      ) {
        let totalDistanceX = 0.0;
        let totalDistanceY = 0.0;
        let counter = 0;

        //We don't count the last point 2x (in touch we do) because mouse slows down more than a finger (touch)
        const numberOfPointsToIgnore = event.inputType === 'touch' ? 1 : 3;

        for (let i = this._dragPoints.length - 1; i >= this._dragPoints.length - numberOfPointsToIgnore; i--) {
          const location = this._dragPoints[i];
          const previousLocation = this._dragPoints[i - 1];
          totalDistanceX += previousLocation.x - location.x;
          totalDistanceY += previousLocation.y - location.y;
          counter++;
        }

        const avgDistanceX = totalDistanceX / counter;
        const avgDistanceY = totalDistanceY / counter;

        const velocityMultiplier = 20;

        //velocity in pixels per second
        const velocityX = -(avgDistanceX * velocityMultiplier);
        const velocityY = -(avgDistanceY * velocityMultiplier);

        const targetPixelLocation = event.viewPoint.copy();

        this._scroller.fling(velocityX, velocityY);
        this._scroller.update(0.99);

        targetPixelLocation.translate2D(this._scroller.deltaX, this._scroller.deltaY);

        this.map.mapNavigator.pan({
          targetLocation: this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(event.viewPoint),
          toViewLocation: targetPixelLocation,
          animate: {
            duration: this._scroller.duration,
            ease: SPLINE_EASE,
          },
        });
      }

      return HandleEventResult.EVENT_HANDLED;
    }

    return HandleEventResult.EVENT_IGNORED;
  }
}
