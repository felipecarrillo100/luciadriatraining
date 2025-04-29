/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Controller } from '@luciad/ria/view/controller/Controller';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { Point } from '@luciad/ria/shape/Point';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { Bounds } from '@luciad/ria/shape/Bounds';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { createBounds } from '@luciad/ria/shape/ShapeFactory';

const annotationCursorIcon = './assets/icons/annotation-cursor.svg';

const CREATION_STYLE: IconStyle = {
  url: annotationCursorIcon,
  width: '46px',
  height: '46px',
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
};

export const POINT_CREATION_EVENT = 'PointCreationEvent';

function addMargin(bounds: Bounds, amount: number): Bounds {
  return createBounds(bounds.reference, [
    bounds.x - amount,
    bounds.width + amount * 2,
    bounds.y - amount,
    bounds.height + amount * 2,
    bounds.z - amount,
    bounds.depth + amount * 2,
  ]);
}

export class LabelAnnotationController extends Controller {
  private readonly eventedSupport = new EventedSupport([POINT_CREATION_EVENT], true);

  private annotationToAdd: Point | null = null;
  constructor() {
    super();
  }

  override onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }
    if (event.type === GestureEventType.MOVE || event.type === GestureEventType.DRAG) {
      let newPoint = null;
      try {
        const worldPoint = this.map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(event.viewPoint);
        newPoint = worldPoint;
        this.annotationToAdd = worldPoint;
      } catch (e) {
        if (!(e instanceof OutOfBoundsError)) {
          throw e;
        }
      }
      if (newPoint) {
        this.annotationToAdd = newPoint;
        this.map.domNode.style.cursor = 'none';
      } else {
        this.annotationToAdd = null;
        this.map.domNode.style.cursor = '';
      }
      this.invalidate();
    } else
      //if (event.type === GestureEventType.SINGLE_CLICK_CONFIRMED && this.annotationToAdd) {
      if (event.type === GestureEventType.SINGLE_CLICK_UP && this.annotationToAdd) {
      const np = this.annotationToAdd.copy();
      this.map.domNode.style.cursor = '';
      this.eventedSupport.emit(POINT_CREATION_EVENT, np);
      this.annotationToAdd = null;
      this.invalidate();
      return HandleEventResult.EVENT_HANDLED;
    }
    return HandleEventResult.EVENT_IGNORED;
  }

  override onDraw(geoCanvas: GeoCanvas) {
    if (this.annotationToAdd) {
      geoCanvas.drawShape(this.annotationToAdd, CREATION_STYLE);
    }
  }

  override on(
    event: 'Activated' | 'Deactivated' | 'Invalidated' | typeof POINT_CREATION_EVENT,
    callback: (...args: any[]) => void,
    context?: any
  ): Handle {
    if (event === POINT_CREATION_EVENT) {
      return this.eventedSupport.on(POINT_CREATION_EVENT, callback);
    } else if (event === 'Activated') {
      return super.on(event, callback);
    } else if (event === 'Deactivated') {
      return super.on(event, callback);
    } else {
      return super.on(event, callback, context);
    }
  }
}
