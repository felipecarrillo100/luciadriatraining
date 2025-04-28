import { LayerType } from '@luciad/ria/view/LayerType.js';
import { RasterTileSetLayer } from '@luciad/ria/view/tileset/RasterTileSetLayer.js';
import { BingMapsTileSetModel } from '@luciad/ria/model/tileset/BingMapsTileSetModel.js';
import { TileSet3DLayer, TileSet3DLayerConstructorOptions } from '@luciad/ria/view/tileset/TileSet3DLayer.js';
import { OGC3DTilesModel } from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
import { FeatureLayer, FeatureLayerConstructorOptions } from '@luciad/ria/view/feature/FeatureLayer.js';
import { FusionPanoramaModel } from '@luciad/ria/model/tileset/FusionPanoramaModel.js';
import { FeatureModel } from '@luciad/ria/model/feature/FeatureModel.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { LayerTreeNode } from '@luciad/ria/view/LayerTreeNode.js';
import { LayerTreeVisitor } from '@luciad/ria/view/LayerTreeVisitor.js';
import { HSPCTilesModel } from '@luciad/ria/model/tileset/HSPCTilesModel.js';
import { PointCloudPointShape } from '@luciad/ria/view/style/PointCloudPointShape.js';
import { ScalingMode } from '@luciad/ria/view/style/ScalingMode.js';
import { WMSTileSetModel } from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import { WMSTileSetLayer } from '@luciad/ria/view/tileset/WMSTileSetLayer.js';
import { Layer } from '@luciad/ria/view/Layer.js';
import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { createBounds } from '@luciad/ria/shape/ShapeFactory.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { LayerGroup } from '@luciad/ria/view/LayerGroup.js';
import { PanoramaFeaturePainter } from '../painters/PanoramaFeaturePainter';
import { UrlTileSetModel } from '@luciad/ria/model/tileset/UrlTileSetModel.js';
import { FusionTileSetModel } from '@luciad/ria/model/tileset/FusionTileSetModel.js';
import { KMLModel } from '@luciad/ria/model/kml/KMLModel.js';
import { KMLLayer } from '@luciad/ria/view/kml/KMLLayer.js';
import { createOffsetTransformation } from '@luciad/ria/transformation/Affine3DTransformation.js';
// import { SliceBoxPainter } from '../painters/SliceBoxPainter.js';
import {FeatureModelOptions} from '../interfaces/CreateLayerInfo';
// import { FeatureModelOptions } from '@pages/map/interfaces/CreateLayerInfo.js';
// import { ELayerId } from '@pages/map/services/feature-layer-store.service.js';

interface TileSet3DLayerConstructorOptionsExtended extends TileSet3DLayerConstructorOptions {
  offsetTransformation?: NonNullable<unknown>;
}

export class LayerFactory {
  public static createBingmapsLayer(bingModel: BingMapsTileSetModel, command: FeatureLayerConstructorOptions) {
    let options = { ...command };
    return new Promise<RasterTileSetLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'Bingmaps';
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
      const layer = new RasterTileSetLayer(bingModel, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  public static createOgc3DTilesLayer(model: OGC3DTilesModel, layerOptions: TileSet3DLayerConstructorOptionsExtended) {
    let options = { ...layerOptions };

    return new Promise<TileSet3DLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'OGC 3D tiles';
      options.selectable = typeof options.selectable !== 'undefined' ? options.selectable : true;
      options.transparency = typeof options.transparency !== 'undefined' ? options.transparency : false;
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
      options.qualityFactor = typeof options.qualityFactor !== 'undefined' ? options.qualityFactor : 1.0;
      options.offsetTerrain = typeof options.offsetTerrain !== 'undefined' ? options.offsetTerrain : false;
      options.isPartOfTerrain = typeof options.isPartOfTerrain !== 'undefined' ? options.isPartOfTerrain : false;

      if (options.offsetTransformation) {
        const defaultOffset = { x: 0, y: 0, z: 0 };
        options.transformation = createOffsetTransformation(
          { ...defaultOffset, ...options.offsetTransformation },
          model.bounds.focusPoint,
        );
      }

      const layer: TileSet3DLayer = new TileSet3DLayer(model, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async createLayerGroup(layerOptions: FeatureLayerConstructorOptions) {
    let options = { ...layerOptions };
    return new Promise<LayerGroup>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'New group';
      const layer = new LayerGroup(options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async createHSPCLayer(model: HSPCTilesModel, layerOptions: TileSet3DLayerConstructorOptionsExtended) {
    let options = { ...layerOptions };

    return new Promise<TileSet3DLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'OGC 3D tiles';
      options.isDrapeTarget = false; // HSPC can not be used for drapping
      options.selectable = typeof options.selectable !== 'undefined' ? options.selectable : false;
      options.transparency = typeof options.transparency !== 'undefined' ? options.transparency : false;
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
      options.qualityFactor = typeof options.qualityFactor !== 'undefined' ? options.qualityFactor : 1.0;
      options.offsetTerrain = typeof options.offsetTerrain !== 'undefined' ? options.offsetTerrain : false;
      options.pointCloudStyle =
        typeof options.pointCloudStyle !== 'undefined'
          ? options.pointCloudStyle
          : {
              pointShape: PointCloudPointShape.DISC,
              pointSize: { mode: ScalingMode.PIXEL_SIZE, pixelSize: 2.0 },
            };
      options.performanceHints = layerOptions.performanceHints;

      if (options.offsetTransformation) {
        const defaultOffset = { x: 0, y: 0, z: 0 };
        options.transformation = createOffsetTransformation(
          { ...defaultOffset, ...options.offsetTransformation },
          model.bounds.focusPoint,
        );
      }

      const layer: TileSet3DLayer = new TileSet3DLayer(model, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async createWMSLayer(model: WMSTileSetModel, layerOptions: FeatureLayerConstructorOptions) {
    return new Promise<WMSTileSetLayer>((resolve) => {
      const layer = new WMSTileSetLayer(model, layerOptions);
      resolve(layer);
    });
  }

  static async createTMSLayer(tmsModel: UrlTileSetModel, layerOptions: FeatureLayerConstructorOptions) {
    let options = { ...layerOptions };
    return new Promise<RasterTileSetLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'TMS layer';
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;

      const layer = new RasterTileSetLayer(tmsModel, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async createLTSLayer(elevationModel: FusionTileSetModel, layerOptions: FeatureLayerConstructorOptions) {
    let options = { ...layerOptions };
    return new Promise<RasterTileSetLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'Elevation';
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
      const layer = new RasterTileSetLayer(elevationModel, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async getLayerBounds(aLayer: LayerTreeNode) {
    return new Promise<Bounds>((resolve, reject) => {
      const layer = aLayer as {
        restoreCommand?: { fitBounds: { reference: string; coordinates: number[] } };
        bounds?: Bounds;
      };
      if (!layer) {
        reject();
        return;
      }
      if (typeof layer.restoreCommand !== 'undefined' && layer.restoreCommand.fitBounds) {
        const fitBounds = layer.restoreCommand.fitBounds;
        const ref = getReference(layer.restoreCommand.fitBounds.reference);
        const coordinates = fitBounds.coordinates;
        const bounds = createBounds(ref, coordinates);
        resolve(bounds);
      } else {
        if (layer instanceof FeatureLayer) {
          if (layer.bounds) {
            resolve(layer.bounds);
            return;
          }
          const queryFinishedHandle = layer.workingSet.on('QueryFinished', () => {
            if (layer.bounds) {
              resolve(layer.bounds);
            } else {
              reject();
            }
            queryFinishedHandle.remove();
          });
        } else {
          resolve(layer.bounds!);
        }
      }
    });
  }

  static async createWFSLayer(model: FeatureModel, layerOptions: FeatureLayerConstructorOptions) {
    return new Promise<FeatureLayer>((resolve) => {
      const layer = new FeatureLayer(model, layerOptions);
      resolve(layer);
    });
  }

  static async createKMLLayer(model: KMLModel, layerOptions: FeatureLayerConstructorOptions) {
    let options = { ...layerOptions };
    return new Promise<KMLLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'KML layer';
      options.visible = typeof options.visible !== 'undefined' ? options.visible : true;
      options.selectable = typeof options.selectable !== 'undefined' ? options.selectable : true;
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;

      const layer = new KMLLayer(model, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async createEditableFeatureLayer(model: FeatureModel, layerOptions: FeatureLayerConstructorOptions) {
    const options = { ...layerOptions };
    return new Promise<FeatureLayer>((resolve, reject) => {
      if (typeof options !== 'undefined') {
        const layer = new FeatureLayer(model, options);
        if (layer) {
          resolve(layer);
        } else {
          reject();
        }
      } else {
        reject();
      }
    });
  }

  static async createPanoramicsLayer(
    model: FeatureModel,
    layerOptions: FeatureLayerConstructorOptions,
    inModelOptions: FeatureModelOptions,
  ) {
    let options = { ...layerOptions } as { iconHeightOffset?: unknown };
    return new Promise<FeatureLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }

      const target = inModelOptions.url;
      const panoModel = new FusionPanoramaModel(target, {
        credentials: inModelOptions.credentials,
        requestHeaders: inModelOptions.requestHeaders,
        requestParameters: inModelOptions.requestParameters,
      });

      const  modelOptions =  inModelOptions as any;
      const layer = new FeatureLayer(model, {
        ...options,
        id: modelOptions.properties['layerId'] || `pano${modelOptions.properties.id}`,
        panoramaModel: panoModel,
        label: layerOptions.label,
        selectable: true,
        hoverable: true,
        painter: new PanoramaFeaturePainter({
          overview: false,
          iconHeightOffset: Number(options.iconHeightOffset), // sensor height in meters above street level (approx)
        }),
      });

      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static isFusionPanoramaLayer(layer: LayerTreeNode) {
    return layer instanceof FeatureLayer && layer.panoramaModel && layer.painter instanceof PanoramaFeaturePainter;
  }

  static findFusionPanoramaLayers(map: WebGLMap) {
    const layers: FeatureLayer[] = [];
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: Layer) => {
          if (layer instanceof FeatureLayer && layer.panoramaModel && layer.painter instanceof PanoramaFeaturePainter) {
            layers.push(layer);
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: LayerGroup) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
    return layers;
  }

  // static async createSlicingBoxLayer(model: FeatureModel, layerOptions: FeatureLayerConstructorOptions) {
  //   const options = { ...layerOptions };
  //   return new Promise<FeatureLayer>((resolve, reject) => {
  //     if (typeof options !== 'undefined') {
  //       const layer = new FeatureLayer(model, options);
  //       if (layer) {
  //         layer.painter = new SliceBoxPainter();
  //         resolve(layer);
  //       } else {
  //         reject();
  //       }
  //     } else {
  //       reject();
  //     }
  //   });
  // }
}
