/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Controller } from '@luciad/ria/view/controller/Controller';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { LocationMode } from '@luciad/ria/transformation/LocationMode';
import { Point } from '@luciad/ria/shape/Point';
import { OutOfBoundsError } from '@luciad/ria/error/OutOfBoundsError';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import {number} from "@luciad/ria/util/expression/ExpressionFactory";

export const OPEN_CONTEXTMENU_EVENT = 'OpenContextMenuEvent';

export interface ContextMenuOnClosestSurfaceControllerEvent {
  position: number[];
  worldPoint: Point;
  viewPoint: Point;
  timestamp: number;
}

export class ContextMenuOnClosestSurfaceController extends Controller {
  private readonly eventedSupport = new EventedSupport([OPEN_CONTEXTMENU_EVENT], true);

  private annotationToAdd: Point | null = null;
  constructor() {
    super();
  }

  override onGestureEvent(event: GestureEvent): HandleEventResult {
    if (!this.map) {
      return HandleEventResult.EVENT_IGNORED;
    }
    if (event.type === GestureEventType.CONTEXT_MENU ) {
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
        this.map.domNode.style.cursor = '';
        this.eventedSupport.emit(OPEN_CONTEXTMENU_EVENT, {
          timestamp: Date.now(),
          worldPoint: newPoint,
          viewPoint: event.viewPoint,
          position: event.clientPosition,
        } as ContextMenuOnClosestSurfaceControllerEvent);
        this.invalidate();
    //    return HandleEventResult.EVENT_HANDLED;
              return HandleEventResult.EVENT_IGNORED;
      }
    }
    return HandleEventResult.EVENT_IGNORED;
  }

  override on(
    event: 'Activated' | 'Deactivated' | 'Invalidated' | typeof OPEN_CONTEXTMENU_EVENT,
    callback: (...args: any[]) => void,
    context?: any
  ): Handle {
    if (event === OPEN_CONTEXTMENU_EVENT) {
      return this.eventedSupport.on(OPEN_CONTEXTMENU_EVENT, callback);
    } else if (event === 'Activated') {
      return super.on(event, callback);
    } else if (event === 'Deactivated') {
      return super.on(event, callback);
    } else {
      return super.on(event, callback, context);
    }
  }
}
