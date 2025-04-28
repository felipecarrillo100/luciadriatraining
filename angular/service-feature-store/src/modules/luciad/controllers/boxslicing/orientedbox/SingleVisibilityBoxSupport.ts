import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { SliceBoxPainter } from '../../../painters/SliceBoxPainter';
import { OrientedBoxAsJSON } from './JSonBox';
import { LuciadMapComponent } from '../../../luciad-map.component';
import {
  AbstractVisibilityBoxSupport,
  CONFIGS_CHANGED_EVENT,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/AbstractVisibilityBoxSupport';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import {
  BOUNDARY_BOX_OUTLINE_COLOR,
  drawBox,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxDrawUtil';
import { createSwitchableEditingControllers } from '@pages/map/luciad-map/controllers/boxslicing/BoxSelectController';
import { Vector3 } from '@luciad/ria/util/Vector3';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { calculatePointingDirection } from '@pages/map/luciad-map/controllers/util/PerspectiveCameraUtil';
import { createFacePolygons } from '@pages/map/luciad-map/controllers/util/AdvancedShapeFactory';
import { distance, rayRectangleIntersection } from '@pages/map/luciad-map/controllers/util/Vector3Util';
import {
  BOX_CHANGED_EVENT,
  OrientedBoxEditingSupport,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxEditingSupport';
import { Controller } from '@luciad/ria/view/controller/Controller';

export interface OrientedBoxWithAttributes {
  id: string;
  name: string;
  shape: OrientedBox;
  color?: string;
}

export interface OrientedBoxWithAttributesAsJSON {
  id: string;
  name: string;
  orientedBox: OrientedBoxAsJSON;
}

/**
 * Event that is emitted when the configs have been changed.
 * This can either be because configs have been added, removed or modified.
 */
export const SV_BOX_CHANGE_EVENT = 'BoxChangeEvent';

/**
 * Support class that sets and updates visibility expressions on a map's Tileset3DLayers, defined by given configs.
 */
export class SingleVisibilityBoxSupport extends AbstractVisibilityBoxSupport {
  protected readonly _eventedSupport: EventedSupport = new EventedSupport([SV_BOX_CHANGE_EVENT], true);
  protected readonly _handles: Handle[] = [];
  protected luciadMap: LuciadMapComponent;
  private _box: OrientedBox;
  private _additionalBoxes: Feature[] = [];
  private feature: Feature;
  private editSupportHelper: OrientedBoxEditingSupport | null = null;

  constructor(
    luciadMap: LuciadMapComponent,
    entry: OrientedBoxWithAttributes,
    additionalBoxes: OrientedBoxWithAttributes[] | null,
  ) {
    super(luciadMap);
    this._box = entry.shape;
    this.feature = new Feature(this._box, { name: entry.name, color: entry.color }, entry.id);
    if (!additionalBoxes) return;
    for (const box of additionalBoxes) {
      if (box.id !== entry.id) {
        const feature = new Feature(box.shape, { name: box.name, color: box.color }, box.id);
        this._additionalBoxes.push(feature);
      }
    }
  }

  replace(entry: OrientedBoxWithAttributes) {
    // this.feature =  new Feature(this._box, {name:entry.name}, entry.id);
    this.editSupportHelper?.updateBoxAndNotify(entry.shape.copy());
    this.feature.shape = entry.shape;
    this.feature.properties = { ...this.feature.properties, ...entry };
    this.updateBox(entry.id, entry.shape);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public triggerUpdate(triggerEvent = true) {
    //   triggerEvent && this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
  }

  public triggerBoxUpdate(triggerEvent = true) {
    triggerEvent && this._eventedSupport.emit(SV_BOX_CHANGE_EVENT);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focusOnBox(configId: string) {
    // Focus item
  }

  /**
   * Visualize all of the configs' boxes.
   */
  unfocus() {
    SliceBoxPainter.focusedConfigId = null;
  }

  /**
   * Updates the visualized box that corresponds to the config with given id.
   */
  updateBox(configId: string, box: OrientedBox) {
    if (this.feature) {
      this.feature.shape = box;
      this.triggerBoxUpdate();
    }
  }

  /**
   * Updates the visualized box color.
   */
  updateBoxColor(color: string): void {
    if (!this.feature) return;
    this.feature.properties = { ...this.feature.properties, color };
    this.triggerBoxUpdate();
  }

  /**
   * Updates the visibility expressions of all TileSet3DLayers on the map to follow this support's configs.
   * If multiple layers have all box expressions applied with the same effects, the resulting expressions will be shared.
   */

  on(event: typeof CONFIGS_CHANGED_EVENT | typeof SV_BOX_CHANGE_EVENT, callback: () => void) {
    return this._eventedSupport.on(event, callback);
  }

  // Defined by Felipe Carrillo
  public clean() {
    // Not used
  }

  public saveState(): OrientedBoxWithAttributes {
    return {
      id: this.feature.id as string,
      name: this.feature.properties['name'],
      color: this.feature.properties['color'],
      shape: this.feature.shape as OrientedBox,
    };
  }

  public handleClickEvent(event: GestureEvent): void {
    // To be implemented by children
    const hoveredBoxId = this.findClosestIntersectedBox(event.viewPoint);
    if (!hoveredBoxId) return;
    this.focusOnBox(hoveredBoxId);
    this.activateEditingMode(hoveredBoxId);
  }

  public activateEditingMode(hoveredBoxId?: string): void {
    const map = this.luciadMap.getMap();
    if (!map || !this.feature) return;

    const boxId = hoveredBoxId ?? (this.feature.id as string);
    const { editSupport, editHandle } = this.notifyHoverOnFeatureId(boxId);

    const backupMapController = map.controller;
    map.controller = createSwitchableEditingControllers(map, editSupport, true, () => {
      map.controller = backupMapController;
      this.unfocus();
      editHandle.remove();
    }) as Controller;
  }

  public notifyHoverOnFeatureId(hoveredBoxId: string) {
    const feature = this.feature;
    const editSupport = new OrientedBoxEditingSupport(
      feature.shape as OrientedBox,
      true,
      feature,
      this._additionalBoxes,
    );
    this.editSupportHelper = editSupport;
    const editHandle = editSupport.on(BOX_CHANGED_EVENT, (box: OrientedBox) => {
      feature.shape = box;
      this.updateBox(hoveredBoxId, box);
    });
    return { editSupport, editHandle };
  }

  closesBoxId(eye: Vector3, pointingDirection: Vector3): null | string {
    let closestBoxId: string | null = null;
    let minDistance = Number.MAX_SAFE_INTEGER;
    const feature = this.feature;
    const box = feature.shape as OrientedBox;
    for (const rectangle of createFacePolygons(box)) {
      const intersectionPoint = rayRectangleIntersection(eye, pointingDirection, rectangle);
      if (intersectionPoint) {
        const intersectionDistance = distance(intersectionPoint, eye);
        if (intersectionDistance < minDistance) {
          minDistance = intersectionDistance;
          closestBoxId = feature.id as string;
        }
      }
    }
    return closestBoxId;
  }

  private findClosestIntersectedBox(viewPoint: Vector3) {
    const map = this.luciadMap.getMap();
    if (!map) {
      return null;
    }
    const eye = (map.camera as PerspectiveCamera).eye;
    const pointingDirection = calculatePointingDirection(map, viewPoint);
    return this.closesBoxId(eye, pointingDirection);
  }

  onDraw(geoCanvas: GeoCanvas) {
    if (!this.feature) return;
    drawBox(geoCanvas, this.feature.shape as OrientedBox, {
      hightlighted: false,
      withOccludedPart: true,
      color: this.feature.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
    });
    for (const feature of this._additionalBoxes) {
      drawBox(geoCanvas, feature.shape as OrientedBox, {
        hightlighted: false,
        withOccludedPart: true,
        color: feature.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
      });
    }
  }
}
