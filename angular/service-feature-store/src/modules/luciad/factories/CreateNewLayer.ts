import { Layer } from '@luciad/ria/view/Layer.js';
import { LayerGroup } from '@luciad/ria/view/LayerGroup.js';

import { ModelFactory } from './ModelFactory';
import { LayerFactory } from './LayerFactory';
import {
  CreateLayerInfo,
  CreateOGC3DTilesModelOptionsExtended,
  FeatureModelOptions,
  FusionTileModel,
  URLTileSetModelConstructorOptionsExtended,
  WFSFeatureStoreConstructorOptionsExtended,
  WMSTileSetModelConstructorOptionsExtended,
} from '../interfaces/CreateLayerInfo';
import {UILayerTypes} from '../interfaces/UILayerTypes';

interface BaseLayer {
  restoreCommand?: CreateLayerInfo;
}

export function CreateNewLayer(layerInfo: CreateLayerInfo) {
  async function createLayerGroup(layerInfo: CreateLayerInfo) {
    const layer = await LayerFactory.createLayerGroup(layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createTMSLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createTMSModel(layerInfo.model as URLTileSetModelConstructorOptionsExtended);
    const layer = await LayerFactory.createTMSLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }

  // async function createSlicingBoxLayer(layerInfo: CreateLayerInfo) {
  //   const model = await ModelFactory.createSlicingBoxModel(layerInfo.model as { referenceText: string; crs: string });
  //   const layer = await LayerFactory.createSlicingBoxLayer(model, layerInfo.layer);
  //   (layer as BaseLayer).restoreCommand = layerInfo;
  //   return layer;
  // }
  async function createWFSLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createWFSModel(layerInfo.model as WFSFeatureStoreConstructorOptionsExtended);
    const layer = await LayerFactory.createWFSLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }

  async function createKMLLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createKMLModel(layerInfo.model);
    const layer = await LayerFactory.createKMLLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createLTSLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createLTSModel(layerInfo.model as FusionTileModel);
    const layer = await LayerFactory.createLTSLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createWMSLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createWMSModel(layerInfo.model as WMSTileSetModelConstructorOptionsExtended);
    const layer = await LayerFactory.createWMSLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createBingmapsLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createBingmapsModel(layerInfo.model);
    const layer = await LayerFactory.createBingmapsLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createPanoramicLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createPanoramicsModel(layerInfo.model as FeatureModelOptions);
    const layer = await LayerFactory.createPanoramicsLayer(
      model,
      layerInfo.layer!,
      layerInfo.model as FeatureModelOptions,
    );
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createHSPCLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createHSPCModel(layerInfo.model as CreateOGC3DTilesModelOptionsExtended);
    const layer = await LayerFactory.createHSPCLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }
  async function createOGC3DTILESLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createOgc3DTilesModel(layerInfo.model as CreateOGC3DTilesModelOptionsExtended);
    const layer = await LayerFactory.createOgc3DTilesLayer(model, layerInfo.layer!);
    (layer as BaseLayer).restoreCommand = layerInfo;
    return layer;
  }

  return new Promise<Layer | LayerGroup>((resolve, reject) => {
    switch (layerInfo.layerType) {
      // case UILayerTypes.SlicingBoxLayer:
      //   {
      //     const layer = createSlicingBoxLayer(layerInfo);
      //     if (layer) resolve(layer);
      //     else reject();
      //   }
      //   break;
      case UILayerTypes.LayerGroup:
        {
          const layer = createLayerGroup(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.PanoramicLayer:
        {
          const layer = createPanoramicLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.HSPCLayer:
        {
          const layer = createHSPCLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.OGC3DTILES:
        {
          const layer = createOGC3DTILESLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.WFSLayer:
        {
          const layer = createWFSLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.KMLLayer:
        {
          const layer = createKMLLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.LTSLayer:
        {
          const layer = createLTSLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.TMSLayer:
        {
          const layer = createTMSLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.WMSLayer:
        {
          const layer = createWMSLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
      case UILayerTypes.BingmapsLayer:
        {
          const layer = createBingmapsLayer(layerInfo);
          if (layer) resolve(layer);
          else reject();
        }
        break;
    }
  });
}
