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
import { NB_SAMPLES, SPLINE_EASE } from './PanInertiaController';

const DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
const INFLEXION = 0.15; // Tension lines cross at (INFLEXION, 1)
const GRAVITY_EARTH = 9.80665;

const DPI = 96; //1 CSS px is defined as 1/96th of an inch
const decelerationFriction = 6.0 / DPI;

function computeDeceleration(friction: number, dpi: number): number {
  return GRAVITY_EARTH * 39.37 * dpi * friction; // (m/s^2) * inch/meter * pixels/inch
}

/**
 * @return {number}
 */
export class Scroller {
  private readonly _flingFriction: number;
  private readonly _physicalCoeff: number;

  private _finished: boolean;
  private _currVelocity = 0;
  private _distance = 0;
  private _duration = 0;
  private _directionX = 0;
  private _directionY = 0;
  private _deltaX = 0;
  private _deltaY = 0;
  private _prevX = 0;
  private _prevY = 0;

  constructor() {
    this._finished = true;
    this._flingFriction = 0.04;
    this._physicalCoeff = computeDeceleration(decelerationFriction, DPI); // look and feel tuning
  }

  get duration(): number {
    return this._duration;
  }

  get deltaY(): number {
    return this._deltaY;
  }

  get deltaX(): number {
    return this._deltaX;
  }

  update(fraction: number): boolean {
    if (this._finished) {
      return false;
    }

    if (fraction < 1.0) {
      const t = fraction;
      const index = Math.floor(NB_SAMPLES * t);
      let distanceCoef = 1;
      const velocityCoef = 0;
      if (index < NB_SAMPLES) {
        distanceCoef = SPLINE_EASE(t);
      }

      this._currVelocity = ((velocityCoef * this._distance) / this._duration) * 1000.0;

      const x = distanceCoef * this._directionX;
      const y = distanceCoef * this._directionY;

      if (t >= 1.0) {
        this._finished = true;
        this._deltaX = 0;
        this._deltaY = 0;
      } else {
        this._deltaX = x - this._prevX;
        this._deltaY = y - this._prevY;
      }

      this._prevX = x;
      this._prevY = y;
    } else {
      this._finished = true;
      this._deltaX = 0;
      this._deltaY = 0;
    }
    return true;
  }

  fling(velocityX: number, velocityY: number): number {
    if (!this._finished) {
      const oldVel = this._currVelocity;

      const dx = this._directionX;
      const dy = this._directionY;

      const hyp = Math.sqrt(dx * dx + dy * dy);

      const ndx = dx / hyp;
      const ndy = dy / hyp;

      const oldVelocityX = ndx * oldVel;
      const oldVelocityY = ndy * oldVel;
      if (Math.sign(velocityX) === Math.sign(oldVelocityX) && Math.sign(velocityY) === Math.sign(oldVelocityY)) {
        velocityX += oldVelocityX;
        velocityY += oldVelocityY;
      }
    }

    this._finished = false;

    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    this._duration = this.getSplineFlingDuration(velocity);

    const totalDistance = this.getSplineFlingDistance(velocity);
    this._distance = totalDistance * Math.sign(velocity);

    const coeffX = velocity === 0 ? 1.0 : velocityX / velocity;
    const coeffY = velocity === 0 ? 1.0 : velocityY / velocity;

    this._prevX = 0;
    this._prevY = 0;
    this._deltaX = 0;
    this._deltaY = 0;
    this._directionX = totalDistance * coeffX;
    this._directionY = totalDistance * coeffY;

    return this._duration;
  }

  getSplineDeceleration(velocity: number): number {
    return Math.log((INFLEXION * Math.abs(velocity)) / (this._flingFriction * this._physicalCoeff));
  }

  getSplineFlingDuration(velocity: number): number {
    const l = this.getSplineDeceleration(velocity);
    const decelMinusOne = DECELERATION_RATE - 1.0;
    return 1000.0 * Math.exp(l / decelMinusOne);
  }

  getSplineFlingDistance(velocity: number): number {
    const l = this.getSplineDeceleration(velocity);
    const decelMinusOne = DECELERATION_RATE - 1.0;
    return this._flingFriction * this._physicalCoeff * Math.exp((DECELERATION_RATE / decelMinusOne) * l);
  }
}
