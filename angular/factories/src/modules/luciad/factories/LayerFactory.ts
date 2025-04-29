import {OGC3DTilesModel} from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
import {TileSet3DLayer} from '@luciad/ria/view/tileset/TileSet3DLayer.js';
import {LayerType} from '@luciad/ria/view/LayerType.js';
import {createOffsetTransformation} from '@luciad/ria/transformation/Affine3DTransformation.js';
import {HSPCTilesModel} from '@luciad/ria/model/tileset/HSPCTilesModel.js';
import {PointCloudPointShape} from '@luciad/ria/view/style/PointCloudPointShape.js';
import {ScalingMode} from '@luciad/ria/view/style/ScalingMode.js';
import {WMSTileSetModel} from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import {WMSTileSetLayer} from '@luciad/ria/view/tileset/WMSTileSetLayer.js';
import {FeatureLayer, FeatureLayerConstructorOptions} from '@luciad/ria/view/feature/FeatureLayer.js';
import {FeatureModel} from '@luciad/ria/model/feature/FeatureModel.js';

export class LayerFactory {

  public static createOgc3DTilesLayer(model: OGC3DTilesModel, layerOptions: any) {
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

  static async createHSPCLayer(model: HSPCTilesModel, layerOptions: any) {
    let options = { ...layerOptions };

    return new Promise<TileSet3DLayer>((resolve, reject) => {
      if (typeof options === 'undefined') {
        options = {};
      }
      options.label = options.label ? options.label : 'OGC 3D tiles';
      options.isDrapeTarget = false; // HSPC cannot be used for drapping
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

  static async createWFSLayer(model: FeatureModel, layerOptions: FeatureLayerConstructorOptions) {
    return new Promise<FeatureLayer>((resolve) => {
      const layer = new FeatureLayer(model, layerOptions);
      resolve(layer);
    });
  }
}
