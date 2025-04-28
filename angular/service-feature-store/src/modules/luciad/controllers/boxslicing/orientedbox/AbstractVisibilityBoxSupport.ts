import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { SliceBoxPainter } from '../../../painters/SliceBoxPainter';
import { LuciadMapComponent } from '../../../luciad-map.component';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { EVENT_IGNORED } from '@luciad/ria/view/controller/HandleEventResult';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';

/**
 * Event that is emitted when the configs have been changed.
 * This can either be because configs have been added, removed or modified.
 */
export const CONFIGS_CHANGED_EVENT = 'ConfigsChangedEvent';

/**
 * Support class that sets and updates visibility expressions on a map's Tileset3DLayers, defined by given configs.
 */
export class AbstractVisibilityBoxSupport {
  protected readonly _eventedSupport: EventedSupport = new EventedSupport([CONFIGS_CHANGED_EVENT], true);
  protected readonly _handles: Handle[] = [];
  protected luciadMap: LuciadMapComponent;

  constructor(luciadMap: LuciadMapComponent) {
    this.luciadMap = luciadMap;
  }

  public triggerUpdate(triggerEvent = true) {
    triggerEvent && this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
    // this.updateExpressions();
  }

  protected getCurrentMap = () => {
    return this.luciadMap.getMap();
  };

  /**
   * Cleans this support by removing the created handles.
   */
  destroy() {
    for (const handle of this._handles) {
      handle.remove();
    }
  }

  /**
   * Only visualize the box of the config with given id.
   */
  focusOnBox(configId: string) {
    SliceBoxPainter.focusedConfigId = configId;
    // 8989 HERE!!!
    // this._layer.painter.invalidateAll();
  }

  /**
   * Visualize all of the configs' boxes.
   */
  unfocus() {
    // To be implemented in children
  }

  /**
   * Updates the visibility expressions of all TileSet3DLayers on the map to follow this support's configs.
   * If multiple layers have all box expressions applied with the same effects, the resulting expressions will be shared.
   */

  on(event: typeof CONFIGS_CHANGED_EVENT, callback: () => void) {
    return this._eventedSupport.on(event, callback);
  }

  // Defined by Felipe Carrillo
  // public clean() {
  //   // if (this._layer) {
  //   //   SliceBoxPainter.focusedConfigId = null;
  //   //   this._layer.painter.invalidateAll();
  //   // }
  // }

  // updateBox(configId: string, box: OrientedBox) {
  //   // to be implemented in children
  // }

  // public closesBoxId(eye: Vector3, pointingDirection: Vector3): null | string {
  //   return null
  // }

  // public notifyHoverOnFeatureId(id: string) {
  //   // to be implemented in children classes
  //   return {editSupport: null, editHandle: null};
  // }

  public initizalize() {
    // To be used by children
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleHoverEvent(event: GestureEvent) {
    return EVENT_IGNORED;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleClickEvent(event: GestureEvent) {
    // To be implemented by children
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDraw(geoCanvas: GeoCanvas) {
    // Do nothing
  }
}
