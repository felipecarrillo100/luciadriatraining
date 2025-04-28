import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import {
  and,
  boolean,
  Expression,
  isInside,
  not,
  or,
  orientedBox,
  ParameterExpression,
} from '@luciad/ria/util/expression/ExpressionFactory';
import { LayerTreeVisitor } from '@luciad/ria/view/LayerTreeVisitor';
import { LayerGroup } from '@luciad/ria/view/LayerGroup';
import { LayerTreeNode } from '@luciad/ria/view/LayerTreeNode';
import { TileSet3DLayer } from '@luciad/ria/view/tileset/TileSet3DLayer';
import { FeatureModel } from '@luciad/ria/model/feature/FeatureModel';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { MemoryStore } from '@luciad/ria/model/store/MemoryStore';
import { JSONBox, OrientedBoxAsJSON } from './JSonBox';

import { Vector3 } from '@luciad/ria/util/Vector3';
import { distance, rayRectangleIntersection } from '../../util/Vector3Util';
import {
  BOX_CHANGED_EVENT,
  OrientedBoxEditingSupport,
} from './OrientedBoxEditingSupport';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { EVENT_HANDLED, EVENT_IGNORED } from '@luciad/ria/view/controller/HandleEventResult';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import { calculatePointingDirection } from '../../util/PerspectiveCameraUtil';
import { createSwitchableEditingControllers } from '../BoxSelectController';
import { Controller } from '@luciad/ria/view/controller/Controller';
import ReturnValue = LayerTreeVisitor.ReturnValue;
import {CRSEnum} from '../../../interfaces/CRS.enum';
import {UICommandActions} from '../../../interfaces/UICommandActions';
import {UILayerTypes} from '../../../interfaces/UILayerTypes';
import {AbstractVisibilityBoxSupport} from './AbstractVisibilityBoxSupport';
import {LuciadMapComponent} from '../../../../../app/components/luciad-map/luciad-map.component';
import {SliceBoxPainter} from '../../../painter/SliceBoxPainter';
import {createFacePolygons} from '../../util/AdvancedShapeFactory';

export const BOX_SLICING_LAYER_GROUP_ID = 'box-slicing-group-id';
export const BOX_SLICING_LAYER_GROUP_LABEL = 'Mesh slicing tool';
export const BOX_SLICING_LAYER_ID = 'box-slicing-layer-id';
export const BOX_SLICING_LAYER_LABEL = 'Visibility filters';
export const BOX_SLICING_EDIT_HELPER_LABEL = 'Edit Filter Helper';

const layerGroupParameters = {
  action: UICommandActions.CreateAnyLayer,
  parameters: {
    layerType: UILayerTypes.LayerGroup,
    layer: {
      label: BOX_SLICING_LAYER_GROUP_LABEL,
      id: BOX_SLICING_LAYER_GROUP_ID,
      collapsed: true,
      visible: true,
      labeled: true,
      treeNodeType: 'LAYER_GROUP',
    },
    model: {},
  },
};

const featureLayerSlicerParameters = {
  action: UICommandActions.CreateAnyLayer,
  parameters: {
    layerType: UILayerTypes.SlicingBoxLayer,
    layer: {
      id: BOX_SLICING_LAYER_ID,
      label: BOX_SLICING_LAYER_LABEL,
      hoverable: true,
    },
    model: {
      crs: CRSEnum.EPSG_4978,
    },
  },
};

export enum Effect {
  NONE,
  VISIBLE_INSIDE,
  VISIBLE_OUTSIDE,
}

export interface VisibilityBoxConfig {
  id: string;
  name: string;
  expression: ParameterExpression<OrientedBox>;
  enabled: boolean;
  isInsideLayers: string[];
  isOutsideLayers: string[];
  newLayersEffect: Effect;
}

export interface VisibilityBoxConfigAsJSON {
  id: string;
  name: string;
  orientedBox: OrientedBoxAsJSON;
  enabled: boolean;
  isInsideLayers: string[];
  isOutsideLayers: string[];
  newLayersEffect: number;
}

/**
 * Event that is emitted when the configs have been changed.
 * This can either be because configs have been added, removed or modified.
 */
export const CONFIGS_CHANGED_EVENT = 'ConfigsChangedEvent';

/**
 * Support class that sets and updates visibility expressions on a map's Tileset3DLayers, defined by given configs.
 */
export class VisibilityBoxSupport extends AbstractVisibilityBoxSupport {
  private _model: FeatureModel;
  private _layer: FeatureLayer;
  private _configs: VisibilityBoxConfig[];

  constructor(luciadMap: LuciadMapComponent, configs: VisibilityBoxConfig[] = []) {
    super(luciadMap);
    this.luciadMap = luciadMap;
    this._configs = configs;
    this.updateExpressions();
    this.initializeNodeAddedListener();
    this.initializeNodeRemovedListener();
  }

  public triggerUpdate(triggerEvent = true) {
    triggerEvent && this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
    this.updateExpressions();
  }

  private configAsFeatures = () => {
    const features: Feature[] = [];
    for (const config of this._configs) {
      const feature = new Feature(config.expression.value, {}, config.id);
      features.push(feature);
    }
    return features;
  };

  public createSliceLayerIfDonNotExist = () => {
    return new Promise<FeatureLayer>((resolve) => {
      this.createSlicingLayerGroupByCommand().then(() => {
        this.createLayerByCommand().then((layer: FeatureLayer) => {
          this._layer = layer;
          this._model = this._layer.model;
          const store = this._model.store as MemoryStore;
          try {
            store.reload(this.configAsFeatures());
          } catch {
            console.log('Error reloading');
          }
          resolve(layer);
        });
      });
    });
  };

  private createSlicingLayerGroupByCommand = () => {
    return new Promise<LayerGroup>((resolve, reject) => {
      const workspaceBuilder = this.luciadMap;
      const layer = workspaceBuilder.getLayerTreeNodeByID(BOX_SLICING_LAYER_GROUP_ID) as LayerGroup;
      if (layer) {
        resolve(layer);
        return;
      }
      const root = workspaceBuilder.getRoot();
      workspaceBuilder.createAnyLayer(layerGroupParameters, root).then(
        (layerGroup: LayerGroup) => {
          resolve(layerGroup);
        },
        () => {
          reject();
        },
      );
    });
  };

  private createLayerByCommand() {
    return new Promise<FeatureLayer>((resolve, reject) => {
      const workspaceBuilder = this.luciadMap;
      const layerGroup = workspaceBuilder.getLayerTreeNodeByID(BOX_SLICING_LAYER_GROUP_ID) as LayerGroup;
      const layer = workspaceBuilder.getLayerTreeNodeByID(BOX_SLICING_LAYER_ID) as FeatureLayer;
      if (layer) {
        if (layerGroup) {
          layerGroup.visible = true;
          layerGroup.moveChild(layer, 'top');
        }
        resolve(layer);
        return;
      }
      workspaceBuilder.createAnyLayer(featureLayerSlicerParameters, layerGroup).then(
        (featureLayer: FeatureLayer) => {
          resolve(featureLayer as FeatureLayer);
        },
        () => {
          reject();
        },
      );
    });
  }

  /**
   * Cleans this support by removing the created handles.
   */
  destroy() {
    for (const handle of this._handles) {
      handle.remove();
    }
    if (this._layer.parent) {
      this._layer.parent.removeChild(this._layer);
    }
  }

  /**
   * Only visualize the box of the config with given id.
   */
  focusOnBox(configId: string) {
    SliceBoxPainter.focusedConfigId = configId;
    this._layer.painter.invalidateAll();
  }

  /**
   * Visualize all of the configs' boxes.
   */
  unfocus() {
    SliceBoxPainter.focusedConfigId = null;
    this._layer?.painter.invalidateAll();
  }

  /**
   * The configs used by this support to create visibility expressions.
   */
  get configs() {
    return [...this._configs];
  }

  /**
   * Adds the given config to the support and reset the visibility expressions to take the new config into account.
   */
  addConfig(config: VisibilityBoxConfig) {
    const index = this._configs.findIndex(({ id }) => id === config.id);
    if (index > -1) return;
    this._configs.push(config);
    this.updateBox(config.id, config.expression.value);
    this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
    this.updateExpressions();
  }

  /**
   * Saves a config to an storable JSON object
   */
  private saveConfigAsJSON(config: VisibilityBoxConfig) {
    const result: VisibilityBoxConfigAsJSON = {
      id: config.id,
      name: config.name,
      orientedBox: JSONBox.save(config.expression.value),
      enabled: config.enabled,
      isInsideLayers: [...config.isInsideLayers],
      isOutsideLayers: [...config.isOutsideLayers],
      newLayersEffect: config.newLayersEffect,
    };
    return result;
  }

  /**
   * Creates a config object from JSON object
   */
  private restoreConfigFromJSON(config: VisibilityBoxConfigAsJSON) {
    const result: VisibilityBoxConfig = {
      id: config.id,
      name: config.name,
      expression: orientedBox(JSONBox.create(config.orientedBox)),
      enabled: config.enabled,
      isInsideLayers: [...config.isInsideLayers],
      isOutsideLayers: [...config.isOutsideLayers],
      newLayersEffect: config.newLayersEffect,
    };
    return result;
  }

  /**
   * Updates the visualized box that corresponds to the config with given id.
   */
  updateBox(configId: string, box: OrientedBox) {
    try {
      this._model?.put(new Feature(box, {}, configId));
    } catch {
      console.log('Failed to add');
    }
  }

  /**
   * Updates the given config that was already present in this support and reset the visibility expressions to take the
   * new update into account.
   */
  updateConfig(config: VisibilityBoxConfig) {
    const index = this._configs.findIndex(({ id }) => id === config.id);
    if (index >= 0) {
      this._configs[index] = config;
      this.updateBox(config.id, config.expression.value);
      this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
      this.updateExpressions();
    }
  }

  /**
   * Remove the config with given id from to the support and reset the visibility expressions to take the removal
   * into account.
   */
  removeConfig(id: string) {
    const index = this._configs.findIndex((config) => id === config.id);
    if (index >= 0) {
      this._configs.splice(index, 1);
      this._model.remove(id);
      this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
      this.updateExpressions();
    }
  }

  /**
   * Updates the visibility expressions of all TileSet3DLayers on the map to follow this support's configs.
   * If multiple layers have all box expressions applied with the same effects, the resulting expressions will be shared.
   */
  private updateExpressions() {
    const createdExpressions = {} as { [key: string]: Expression<boolean> };

    const visitor: LayerTreeVisitor = {
      visitLayer: (layer): LayerTreeVisitor.ReturnValue => {
        if (!(layer instanceof TileSet3DLayer)) {
          return ReturnValue.CONTINUE;
        }
        const insideExpressions: ParameterExpression<OrientedBox>[] = [];
        const outsideExpressions: ParameterExpression<OrientedBox>[] = [];
        const inIds = [] as string[];
        const outIds = [] as string[];
        for (const config of this._configs) {
          if (!config.enabled) {
            continue;
          }
          if (config.isInsideLayers.indexOf(layer.id) >= 0) {
            insideExpressions.push(config.expression);
            inIds.push(config.id);
          }
          if (config.isOutsideLayers.indexOf(layer.id) >= 0) {
            outsideExpressions.push(config.expression);
            outIds.push(config.id);
          }
        }

        const expressionKey = `ìn: [${inIds.join(',')}], out: [${outIds.join(',')}]`;

        let expression;
        if (createdExpressions[expressionKey]) {
          expression = createdExpressions[expressionKey];
        } else {
          expression = this.createVisibilityExpression(insideExpressions, outsideExpressions);
          createdExpressions[expressionKey] = expression;
        }
        // Assign layer expression asynchronously to avoid blocking
        setTimeout(() => {
          layer.meshStyle.visibilityExpression = expression;
          layer.pointCloudStyle.visibilityExpression = expression;
        });
        return LayerTreeVisitor.ReturnValue.CONTINUE;
      },
      visitLayerGroup: (layerGroup: LayerGroup): LayerTreeVisitor.ReturnValue => {
        layerGroup.visitChildren(visitor, LayerTreeNode.VisitOrder.TOP_DOWN);
        return LayerTreeVisitor.ReturnValue.CONTINUE;
      },
    };
    this.getCurrentMap().layerTree.accept(visitor);
  }

  private createVisibilityExpression(
    insideExpressions: ParameterExpression<OrientedBox>[],
    outsideExpressions: ParameterExpression<OrientedBox>[],
  ) {
    const insideExpression =
      insideExpressions.length === 0 ? boolean(true) : or(...insideExpressions.map((box) => isInside(box)));
    const outsideExpression =
      outsideExpressions.length === 0 ? boolean(true) : and(...outsideExpressions.map((box) => not(isInside(box))));

    return and(insideExpression, outsideExpression);
  }

  private initializeNodeAddedListener() {
    let configsChanged = false;
    const visitor: LayerTreeVisitor = {
      visitLayer: (layer): LayerTreeVisitor.ReturnValue => {
        if (!(layer instanceof TileSet3DLayer)) {
          return ReturnValue.CONTINUE;
        }
        for (const config of this._configs) {
          configsChanged = configsChanged || config.newLayersEffect !== Effect.NONE;
          if (config.newLayersEffect === Effect.VISIBLE_INSIDE) {
            config.isInsideLayers.push(layer.id);
          } else if (config.newLayersEffect === Effect.VISIBLE_OUTSIDE) {
            config.isInsideLayers.push(layer.id);
          }
        }
        return LayerTreeVisitor.ReturnValue.CONTINUE;
      },
      visitLayerGroup: (layerGroup: LayerGroup): LayerTreeVisitor.ReturnValue => {
        layerGroup.visitChildren(visitor, LayerTreeNode.VisitOrder.TOP_DOWN);
        return LayerTreeVisitor.ReturnValue.CONTINUE;
      },
    };
    this._handles.push(
      this.getCurrentMap().layerTree.on('NodeAdded', (change) => {
        configsChanged = false;
        change.node.accept(visitor);
        if (configsChanged) {
          this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
          this.updateExpressions();
        }
      }),
    );
  }

  private initializeNodeRemovedListener() {
    this._handles.push(
      this.getCurrentMap().layerTree.on('NodeRemoved', (change) => {
        let hasChanged = false;
        for (const config of this._configs) {
          const sizeInsideLayers = config.isInsideLayers.length;
          const sizeOutsideLayers = config.isOutsideLayers.length;
          config.isInsideLayers = config.isInsideLayers.filter((id) => !change.node.findLayerById(id));
          config.isOutsideLayers = config.isOutsideLayers.filter((id) => !change.node.findLayerById(id));
          hasChanged ||=
            sizeInsideLayers !== config.isInsideLayers.length || sizeOutsideLayers !== config.isOutsideLayers.length;
        }
        if (hasChanged) {
          this._eventedSupport.emit(CONFIGS_CHANGED_EVENT);
          this.updateExpressions();
        }
      }),
    );
  }

  on(event: typeof CONFIGS_CHANGED_EVENT, callback: () => void) {
    return this._eventedSupport.on(event, callback);
  }

  // Defined by Felipe Carrillo
  public clean() {
    if (this._layer) {
      SliceBoxPainter.focusedConfigId = null;
      this._layer.painter.invalidateAll();
    }
  }

  public saveState(): VisibilityBoxConfigAsJSON[] {
    const allConfigs: VisibilityBoxConfigAsJSON[] = [];
    for (const config of this._configs) {
      allConfigs.push(this.saveConfigAsJSON(config));
    }
    return allConfigs;
  }

  public restoreState(inputConfigs: VisibilityBoxConfigAsJSON[], createLayer = true) {
    const restoreLayersTask = () => {
      this._configs = [];
      for (const config of inputConfigs) {
        this._configs.push(this.restoreConfigFromJSON(config));
      }
      this.triggerUpdate();
      if (createLayer) this.createSliceLayerIfDonNotExist();
    };
    restoreLayersTask();
  }

  public closesBoxId(eye: Vector3, pointingDirection: Vector3) {
    let closestBoxId: string | null = null;
    let minDistance = Number.MAX_SAFE_INTEGER;
    for (const config of this.configs) {
      const box = config.expression.value;
      for (const rectangle of createFacePolygons(box)) {
        const intersectionPoint = rayRectangleIntersection(eye, pointingDirection, rectangle);
        if (intersectionPoint) {
          const intersectionDistance = distance(intersectionPoint, eye);
          if (intersectionDistance < minDistance) {
            minDistance = intersectionDistance;
            closestBoxId = config.id;
          }
        }
      }
    }
    return closestBoxId;
  }

  public notifyHoverOnFeatureId(hoveredBoxId: string) {
    const config = this.configs.find(({ id }) => id === hoveredBoxId);
    const editSupport = new OrientedBoxEditingSupport(config.expression.value);
    const editHandle = editSupport.on(BOX_CHANGED_EVENT, (box: OrientedBox) => {
      config.expression.value = box;
      this.updateBox(hoveredBoxId, box);
    });
    return { editSupport, editHandle };
  }

  public initizalize() {
    this.createSliceLayerIfDonNotExist().then((boxLayer) => {
      if (boxLayer) {
        boxLayer.visible = true;
        this.unfocus();
      }
    });
  }

  public handleHoverEvent(event: GestureEvent) {
    const map = this.luciadMap.getMap();
    const hoveredBoxId = this.findClosestIntersectedBox(event.viewPoint);
    const boxLayer = map.layerTree.findLayerById(BOX_SLICING_LAYER_ID);
    if (!boxLayer) return EVENT_IGNORED;
    if (hoveredBoxId !== null && (boxLayer as FeatureLayer)?.workingSet.get().find((box) => box.id === hoveredBoxId)) {
      const box = (boxLayer.model as FeatureModel).get(hoveredBoxId) as Feature;
      map?.hoverObjects([{ objects: [box], layer: boxLayer as FeatureLayer }]);
    } else {
      map?.clearHovered();
    }
    return EVENT_HANDLED;
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

  public handleClickEvent(event: GestureEvent) {
    const map = this.luciadMap.getMap();
    const hoveredBoxId = this.findClosestIntersectedBox(event.viewPoint);
    if (hoveredBoxId) {
      this.focusOnBox(hoveredBoxId);
      const { editSupport, editHandle } = this.notifyHoverOnFeatureId(hoveredBoxId);
      if (map) {
        const backupMapController = map.controller;
        map.controller = createSwitchableEditingControllers(map, editSupport, true, () => {
          map.controller = backupMapController;
          this.unfocus();
          editHandle.remove();
        }) as Controller;
      }
    }
  }
}
