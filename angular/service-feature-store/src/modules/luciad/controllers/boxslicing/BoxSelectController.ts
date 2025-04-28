import { Controller } from '@luciad/ria/view/controller/Controller';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { GestureEventType } from '@luciad/ria/view/input/GestureEventType';
import { BoxResizeController } from './BoxResizeController';
import { OrientedBoxEditingSupport } from './orientedbox/OrientedBoxEditingSupport';
import { Map } from '@luciad/ria/view/Map';
import { BoxMoveController } from './BoxMoveController';

import { AbstractVisibilityBoxSupport } from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/AbstractVisibilityBoxSupport';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';

export function createSwitchableEditingControllers(
  map: Map,
  editSupport: OrientedBoxEditingSupport,
  startsWithResizing: boolean,
  onClickOutsideBox: () => void,
) {
  // @typescript-eslint/no-empty-function
  let resizeOnClick = (_: boolean) => {};

  const moveOnClick = (intersectsBox: boolean) => {
    if (intersectsBox) {
      map.controller = new BoxResizeController(editSupport, { onClick: resizeOnClick });
    } else {
      onClickOutsideBox();
    }
  };

  resizeOnClick = (intersectsBox: boolean) => {
    if (intersectsBox) {
      map.controller = new BoxMoveController(editSupport, { onClick: moveOnClick }) as Controller;
    } else {
      onClickOutsideBox();
    }
  };

  if (startsWithResizing) {
    return new BoxResizeController(editSupport, { onClick: resizeOnClick });
  } else {
    return new BoxMoveController(editSupport, { onClick: moveOnClick });
  }
}

/**
 * Controller used to visualize and select the oriented boxes from a given {@link VisibilityBoxSupport}.
 * When selecting an oriented box, the map's controller is switched to a {@link BoxResizeController} which allows
 * users to switch to a {@link BoxMoveController} and back by clicking on the oriented box.
 * When clicking outside of the edited box, this controller is put back on the map.
 */
export class BoxSelectController extends Controller {
  private _support: AbstractVisibilityBoxSupport;
  private readonly _onChangeController: (controller: Controller) => void;

  /**
   * Creates a new BoxSelectController with given visibility support and callback that is used to set a new controller
   * on the map.
   * If that callback isn't passed, this controller will just set the controller directly on the map.
   */
  constructor(support: AbstractVisibilityBoxSupport, onChangeController?: (controller: Controller) => void) {
    super();
    this._support = support;
    this._onChangeController =
      onChangeController ??
      ((controller: Controller) => {
        if (this.map) {
          this.map.controller = controller;
        }
      });
  }

  onActivate(map: Map) {
    this._support.initizalize();
    super.onActivate(map);
  }

  onDeactivate(map: Map) {
    this.map?.clearHovered();
    return super.onDeactivate(map);
  }

  onGestureEvent(event: GestureEvent): HandleEventResult {
    if (event.type === GestureEventType.MOVE) {
      return this.handleHoverEvent(event);
    } else if (event.type === GestureEventType.SINGLE_CLICK_UP) {
      this.handleClick(event);
    }
    return super.onGestureEvent(event);
  }

  private handleHoverEvent(event: GestureEvent) {
    const result = this._support.handleHoverEvent(event);
    if (result === HandleEventResult.EVENT_HANDLED) return result;
    return super.onGestureEvent(event);
  }

  private handleClick(event: GestureEvent) {
    this._support.handleClickEvent(event);
  }

  onDraw(geoCanvas: GeoCanvas) {
    this._support.onDraw(geoCanvas);
  }

  getBoxSupport() {
    return this._support;
  }
}
