import { Layer } from '@luciad/ria/view/Layer.js';
import { LayerGroup } from '@luciad/ria/view/LayerGroup.js';

import { ModelFactory } from './ModelFactory';
import { LayerFactory } from './LayerFactory';
import {UILayerTypes} from '../interfaces/UILayerTypes';
import {CreateLayerInfo} from '../interfaces/CreateLayerInfo';



export function CreateNewLayer(layerInfo: CreateLayerInfo) {

  async function createWMSLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createWMSModel(layerInfo.model);
    const layer = await LayerFactory.createWMSLayer(model, layerInfo.layer!);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  }

  async function createHSPCLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createHSPCModel(layerInfo.model);
    const layer = await LayerFactory.createHSPCLayer(model, layerInfo.layer!);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  }
  async function createOGC3DTILESLayer(layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createOgc3DTilesModel(layerInfo.model );
    const layer = await LayerFactory.createOgc3DTilesLayer(model, layerInfo.layer!);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  }

  return new Promise<Layer | LayerGroup>((resolve, reject) => {
    switch (layerInfo.layerType) {
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
      case UILayerTypes.WMSLayer:
      {
        const layer = createWMSLayer(layerInfo);
        if (layer) resolve(layer);
        else reject();
      }
        break;
    }
  });
}
