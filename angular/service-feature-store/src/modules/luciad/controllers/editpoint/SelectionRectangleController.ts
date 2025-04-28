import { createBounds } from '@luciad/ria/shape/ShapeFactory.js';
import { Controller } from '@luciad/ria/view/controller/Controller.js';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult.js';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { Point } from '@luciad/ria/shape/Point.js';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent.js';
import { Map } from '@luciad/ria/view/Map.js';
import { CursorHandle } from '@luciad/ria/view/CursorManager.js';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { ELayerId } from '@pages/map/services/feature-layer-store.service';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';

/**
 * Base class for rectangle-based controllers (select-by-rectangle, zoom-by-rectangle,...)
 **/
export const SELECTION_RECTANGLE_FINISHED_EVENT = 'SelectionRectangleFinishedEvent';

export class SelectionRectangleController extends Controller {
  private _overlayCanvas: HTMLCanvasElement | null = null;
  private _overlayCtx: CanvasRenderingContext2D | null = null;

  private _rectangleStrokeColor = 'rgb(96, 134, 238)';
  private _rectangleStrokeWidth = 3;
  private _rectangleFillColor = 'rgba(96, 134, 238, 0.5)';

  private _isDragging = false;
  private _startPoint: Point | null = null;
  private _currentPoint: Point | null = null;
  private _currentBounds: Bounds | null = null;

  private _dragCursorHandle: CursorHandle | null = null;
  private readonly _eventedSupport: EventedSupport;
  private _finished = false;

  constructor() {
    super();
    this._eventedSupport = new EventedSupport([SELECTION_RECTANGLE_FINISHED_EVENT], true);
  }

  public onActivate(map: Map) {
    super.onActivate(map);
    this._finished = false;
    this._overlayCanvas = document.createElement('canvas');
    this._overlayCanvas.style.position = 'absolute';
    this._overlayCanvas.style.top = '0';
    this._overlayCanvas.style.left = '0';
    this._overlayCanvas.style.width = '100%';
    this._overlayCanvas.style.height = '100%';
    this._overlayCanvas.style.zIndex = '1000';
    this._overlayCanvas.style.pointerEvents = 'none';
    this._overlayCtx = this._overlayCanvas.getContext('2d');
    map.domNode.appendChild(this._overlayCanvas);
  }

  public onDeactivate(map: Map) {
    if (this._overlayCanvas) {
      map.domNode.removeChild(this._overlayCanvas);
    }
    return super.onDeactivate(map);
  }

  public onDraw() {
    // don't draw on GeoCanvas, but on HTML canvas
    if (this.map && this._overlayCanvas && this._overlayCtx) {
      this._overlayCanvas.width = this.map.viewSize[0];
      this._overlayCanvas.height = this.map.viewSize[1];
      this._overlayCtx.clearRect(0, 0, this._overlayCanvas.width, this._overlayCanvas.height);
      if (this._currentBounds) {
        this._overlayCtx.strokeStyle = this._rectangleStrokeColor;
        this._overlayCtx.lineWidth = this._rectangleStrokeWidth;
        this._overlayCtx.fillStyle = this._rectangleFillColor;
        this._overlayCtx.fillRect(
          this._currentBounds.x,
          this._currentBounds.y,
          this._currentBounds.width,
          this._currentBounds.height,
        );
        this._overlayCtx.strokeRect(
          this._currentBounds.x,
          this._currentBounds.y,
          this._currentBounds.width,
          this._currentBounds.height,
        );
      }
    }
  }

  public onGestureEvent(event: GestureEvent) {
    switch (event.type) {
      case GestureEventType.DRAG:
        return this.startDragging(event);
      case GestureEventType.DRAG_END:
        return this.finishDragging(event);
      case GestureEventType.DOUBLE_CLICK:
        return this.handleDoubleClick();
      default:
        return HandleEventResult.EVENT_IGNORED;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override on(event: string, callback: any): Handle {
    if (event === SELECTION_RECTANGLE_FINISHED_EVENT) {
      return this._eventedSupport.on(event, callback);
    } else return super.on(event as never, callback as never);
  }

  private startDragging(event: GestureEvent) {
    if (!this._isDragging) {
      this._startPoint = event.viewPoint;
      this._isDragging = true;
      if (this.map) {
        this._dragCursorHandle = this.map.cursorManager.addCursor('crosshair');
      }
    } else {
      this._currentPoint = event.viewPoint;
      if (this._startPoint && this._currentPoint) {
        this._currentBounds = this.calculateDrawnRectangleBounds(this._startPoint, this._currentPoint);
      } else {
        this._currentBounds = null;
      }
      this.invalidate(); //trigger re-draw
    }
    return HandleEventResult.EVENT_HANDLED;
  }

  private finishDragging(event: GestureEvent) {
    if (!this._isDragging) {
      return HandleEventResult.EVENT_IGNORED;
    }
    this._currentPoint = event.viewPoint;
    if (this._startPoint && this._currentPoint) {
      this._currentBounds = this.calculateDrawnRectangleBounds(this._startPoint, this._currentPoint);
      this.selectFeaturesFromDraggedRectangle(this._currentBounds);
      this.finishSelectionRectangle();
      this.reset();
    }
    return HandleEventResult.EVENT_HANDLED;
  }

  private calculateDrawnRectangleBounds(p1: Point, p2: Point): Bounds {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const width = maxX - minX;
    const height = maxY - minY;

    return createBounds(p1.reference, [minX, width, minY, height]);
  }

  private selectFeaturesFromDraggedRectangle(viewBounds: Bounds | null): void {
    if (!this.map) return;
    const centerView = viewBounds.focusPoint;
    const pickedObjects = this.map.pickAtRectangle(centerView.x, centerView.y, viewBounds.width, viewBounds.height);
    const featureLayers = pickedObjects.filter(
      (layer) => layer.layer instanceof FeatureLayer && layer.layer.id !== ELayerId.boundary,
    );
    this.map.selectObjects(featureLayers);
  }

  private finishSelectionRectangle() {
    this._finished = true;
    this._eventedSupport.emit(SELECTION_RECTANGLE_FINISHED_EVENT);
  }

  private reset() {
    this._isDragging = false;
    this._currentBounds = null;
    this._startPoint = null;
    this._currentPoint = null;
    this._dragCursorHandle?.remove();
    this.invalidate();
  }

  private handleDoubleClick() {
    if (this._finished) {
      return HandleEventResult.EVENT_IGNORED;
    }
    this.finishSelectionRectangle();
    return HandleEventResult.EVENT_HANDLED;
  }
}
