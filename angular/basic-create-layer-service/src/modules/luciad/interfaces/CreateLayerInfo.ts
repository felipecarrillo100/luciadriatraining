import {UILayerTypes} from './UILayerTypes';

export interface CreateLayerInfo {
  fitBounds: unknown;
  layerType: UILayerTypes;
  model: any;
  layer: any;
  autoZoom: boolean;
}
