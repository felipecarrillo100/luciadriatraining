/*
 *
 * Copyright (c) 1999-2022 Luciad All Rights Reserved.
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
import { Controller } from '@luciad/ria/view/controller/Controller';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import {
  Measurement,
  MEASUREMENT_CHANGED_EVENT,
  MeasurementPaintStyles,
  MEASUREMENTS_MODEL_REFERENCE,
  MeasurementSegment,
} from './measurement/Measurement';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { EVENT_IGNORED, HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { Transformation } from '@luciad/ria/transformation/Transformation';
import { Map } from '@luciad/ria/view/Map';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { Point } from '@luciad/ria/shape/Point';
import { MeasurementProjector } from './ThreePointProjector';

export const MEASUREMENT_FINISHED_EVENT = 'MeasurementFinished';
export const ENABLED_CHANGE_EVENT = 'ENABLED_CHANGED';

export const MEASUREMENT_CHANGED = 'MEASUREMENT_CHANGED';

export interface Ruler3DControllerCreateOptions {
  styles: MeasurementPaintStyles;
  maxSegments?: number;
  enabled?: boolean;
  projector?: MeasurementProjector;
}

export class SA_Ruler3DController<S extends MeasurementSegment = MeasurementSegment> extends Controller {
  private readonly _eventedSupport: EventedSupport;
  private readonly _maxSegments: number;
  private readonly _measurementStyles: MeasurementPaintStyles;
  private readonly _projector?: MeasurementProjector;
  private _measurement: Measurement<S>;
  private _worldToModel?: Transformation;
  private _enabled: boolean;
  private _finished = false;
  private _measurementHandle: Handle | null = null;
  private prevCursorValue = 'default';

  constructor(
    measurement: Measurement<S>,
    { styles, enabled = true, maxSegments = Number.MAX_SAFE_INTEGER, projector }: Ruler3DControllerCreateOptions,
  ) {
    super();
    this._eventedSupport = new EventedSupport(
      [MEASUREMENT_FINISHED_EVENT, ENABLED_CHANGE_EVENT, MEASUREMENT_CHANGED],
      true,
    );
    this._measurementStyles = styles;
    this._projector = projector;
    this._measurement = measurement;
    this.listenToMeasurementChanges();
    this._enabled = enabled;
    this._maxSegments = maxSegments;
  }

  override onActivate(map: Map) {
    super.onActivate(map);
    this._worldToModel = createTransformation(map.reference, MEASUREMENTS_MODEL_REFERENCE);
    this._finished = false;
    this.prevCursorValue = map.domNode.style.cursor;
    map.domNode.style.cursor = 'crosshair';
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(enabled: boolean) {
    if (this._enabled !== enabled) {
      this._enabled = enabled;
      if (this.map) this.map.domNode.style.cursor = enabled ? 'crosshair' : 'default';
      this._eventedSupport.emit(ENABLED_CHANGE_EVENT, enabled);
    }
  }

  get measurement(): Measurement<S> {
    return this._measurement;
  }

  set measurement(value: Measurement<S>) {
    this._measurement = value;
    this.invalidate();
    this.listenToMeasurementChanges();
  }

  //#snippet gesture
  /**
   * Handle the user input gestures. The event-object contains information about the type of user-interaction
   */
  override onGestureEvent(gestureEvent: GestureEvent): HandleEventResult {
    if (!this._enabled) {
      return EVENT_IGNORED;
    }
    if (this._projector && !this._projector?.ready) {
      const result = this._projector.handleEventForInitialization(gestureEvent);
      if (result === HandleEventResult.EVENT_HANDLED) {
        this.invalidate();
      }
      return result;
    } else if (gestureEvent.type === GestureEventType.SINGLE_CLICK_UP) {
      return this.handleClick(gestureEvent);
    } else if (gestureEvent.type === GestureEventType.MOVE) {
      return this.handleMove(gestureEvent);
    } else if (gestureEvent.type === GestureEventType.DOUBLE_CLICK) {
      return this.handleDoubleClick();
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
  }

  //#endsnippet gesture

  private handleClick(gestureEvent: GestureEvent) {
    if (this._finished) {
      this._measurement.reset();
      this._finished = false;
    }
    if (this._measurement.pointCount >= this._maxSegments) {
      this.finishMeasurement();
    } else {
      const modelPoint = this.toModelPoint(gestureEvent);
      if (modelPoint) {
        this._measurement.addPoint(modelPoint);
        this._eventedSupport.emit(MEASUREMENT_CHANGED, {
          totalInfo: this.measurement.totalInfo,
        });
      }
    }
    return HandleEventResult.EVENT_HANDLED;
  }

  private handleMove(gestureEvent: GestureEvent) {
    const modelPoint = this.toModelPoint(gestureEvent);
    if (this._measurement.pointCount > 0 && !this._finished && modelPoint) {
      if (this._measurement.pointCount === 1) {
        this._measurement.addPoint(this._measurement.getPointListCopy()[0]);
      }
      this._eventedSupport.emit(MEASUREMENT_CHANGED, {
        totalInfo: this.measurement.totalInfo,
      });

      this._measurement.move3DPoint(this._measurement.pointCount - 1, modelPoint);
      return HandleEventResult.EVENT_HANDLED;
    } else {
      return HandleEventResult.EVENT_IGNORED;
    }
  }

  private handleDoubleClick() {
    if (this._finished) {
      return HandleEventResult.EVENT_IGNORED;
    }
    //remove the point that was created because of the first click of this double_click event
    this._measurement.removePoint(this._measurement.pointCount - 1);
    this.finishMeasurement();
    return HandleEventResult.EVENT_HANDLED;
  }

  private finishMeasurement() {
    this._finished = true;
    this._eventedSupport.emit(MEASUREMENT_FINISHED_EVENT, this._measurement);
  }

  private toModelPoint(gestureEvent: GestureEvent): Point | null {
    try {
      let modelPoint;
      if (this._projector) {
        modelPoint = this._projector.project(gestureEvent.viewPoint);
      } else {
        modelPoint = this._worldToModel?.transform(
          this.map?.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(gestureEvent.viewPoint),
        );
      }
      return modelPoint;
    } catch (e) {
      if (e instanceof OutOfBoundsError) {
        return null;
      } else {
        throw e;
      }
    }
  }

  private listenToMeasurementChanges() {
    if (this._measurementHandle) {
      this._measurementHandle.remove();
    }
    this._measurementHandle = this.measurement.on(MEASUREMENT_CHANGED_EVENT, () => this.invalidate());
  }

  override onDraw(geoCanvas: GeoCanvas) {
    this._measurement.paintBody(geoCanvas, this._measurementStyles);
    if (this._projector) {
      this._projector.paintProjection(geoCanvas);
    }
  }

  override onDrawLabel(labelCanvas: LabelCanvas) {
    this._measurement.paintLabel(labelCanvas, this._measurementStyles);
  }

  override onDeactivate(map: Map) {
    map.domNode.style.cursor = this.prevCursorValue;
    return super.onDeactivate(map);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override on(event: string, callback: any): Handle {
    if (event === MEASUREMENT_FINISHED_EVENT || event === ENABLED_CHANGE_EVENT || event === MEASUREMENT_CHANGED) {
      return this._eventedSupport.on(event, callback);
    } else return super.on(event as never, callback as never);
  }
}
