import {Layer} from "@luciad/ria/view/Layer";
import {ModelFactory} from "./ModelFactory";
import {LayerFactory} from "./LayerFactory";
import {CreateLayerInfo} from "../../interfaces/CreateLayerInfo";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {CustomClusteringPainter} from "../painters/CustomClusteringPainter";
import {PoiPainter} from "../painters/PoiPainter";
import {create} from "@luciad/ria/view/feature/transformation/ClusteringTransformer";

export function CreateNewLayer(layerInfo: CreateLayerInfo) {

  async function createLayerGroup (layerInfo: CreateLayerInfo) {
    const layer = await LayerFactory.createLayerGroup(layerInfo.layer);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  };
  async function createTMSLayer (layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createTMSModel(layerInfo.model);
    const layer = await LayerFactory.createTMSLayer(model, layerInfo.layer);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  };

  async function createWFSLayer (layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createWFSModel(layerInfo.model);
    const layer = await LayerFactory.createWFSLayer(model, layerInfo.layer);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  };

  async function createMemoryFeatureLayer (layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createMemoryFeatureModel(layerInfo.model);
    const layer = await LayerFactory.createEditableFeatureLayer(model, layerInfo.layer);
    layer.painter = new CustomClusteringPainter(new PoiPainter(), {normal: {stroke: 'red'}, selected:{stroke: 'rgba(255,192,203,0.6)'}});
    layer.transformer = create({/*classifier: new FClassClassifier(),*/ defaultParameters:{clusterSize:200}});

    (layer as any).restoreCommand = layerInfo;
    return layer;
  };

  async function createLTSLayer (layerInfo: CreateLayerInfo) {
    const model = await ModelFactory.createLTSModel(layerInfo.model);
    const layer = await LayerFactory.createLTSLayer(model, layerInfo.layer);
    (layer as any).restoreCommand = layerInfo;
    return layer;
  };
    async function createWMSLayer (layerInfo: CreateLayerInfo) {
        const model = await ModelFactory.createWMSModel(layerInfo.model);
        const layer = await LayerFactory.createWMSLayer(model, layerInfo.layer);
        (layer as any).restoreCommand = layerInfo;
        return layer;
    };
    async function createBingmapsLayer(layerInfo: CreateLayerInfo) {
      const model = await ModelFactory.createBingmapsModel(layerInfo.model);
      const layer = await LayerFactory.createBingmapsLayer(model, layerInfo.layer);
      (layer as any).restoreCommand = layerInfo;
      return layer;
    };
    async function createPanoramicLayer (layerInfo: CreateLayerInfo) {
      const model = await ModelFactory.createPanoramicsModel(layerInfo.model);
      const layer = await LayerFactory.createPanoramicsLayer(model, layerInfo.layer, layerInfo.model);
      (layer as any).restoreCommand = layerInfo;
      return layer;
    };
    async function createCustomPanoramicLayer (layerInfo: CreateLayerInfo) {
      const model = await ModelFactory.createCustomPanoramicsModel(layerInfo.model);
      const layer = await LayerFactory.createCustomPanoramicsLayer(model, layerInfo.layer, layerInfo.model);
      (layer as any).restoreCommand = layerInfo;
      return layer;
    };

    async function createHSPCLayer (layerInfo: CreateLayerInfo) {
      const model = await ModelFactory.createHSPCModel(layerInfo.model);
      const layer = await LayerFactory.createHSPCLayer(model, layerInfo.layer);
      (layer as any).restoreCommand = layerInfo;
      return layer;
    };
    async function createOGC3DTILESLayer (layerInfo: CreateLayerInfo) {
      const model = await ModelFactory.createOgc3DTilesModel(layerInfo.model);
      const layer = await LayerFactory.createOgc3DTilesLayer(model, layerInfo.layer);
      (layer as any).restoreCommand = layerInfo;
      return layer;
    };

    return new Promise<Layer>((resolve, reject)=> {
        switch (layerInfo.layerType) {
            case UILayerTypes.LayerGroup: {
              const layer =  createLayerGroup(layerInfo);
              if (layer) resolve(layer as any); else reject();
            }
            break;
            case UILayerTypes.PanoramicLayer:
            {
              const layer =  createPanoramicLayer(layerInfo);
              if (layer) resolve(layer); else reject();
            }
            break;
            case UILayerTypes.CustomPanoramicLayer:
            {
              const layer =  createCustomPanoramicLayer(layerInfo);
              if (layer) resolve(layer); else reject();
            }
            break;
            case UILayerTypes.HSPCLayer:
            {
              const layer =  createHSPCLayer(layerInfo);
              if (layer) resolve(layer); else reject();
            }
            break;
            case UILayerTypes.OGC3DTILES:
            {
              const layer =  createOGC3DTILESLayer(layerInfo);
              if (layer) resolve(layer); else reject();
            }
            break;
          case UILayerTypes.WFSLayer:
          {
            const layer =  createWFSLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break;
          case UILayerTypes.GeoJSONLayer: {
            const layer =  createMemoryFeatureLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break;
          case UILayerTypes.LTSLayer:
          {
            const layer =  createLTSLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break;
          case UILayerTypes.TMSLayer:
          {
            const layer =  createTMSLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break;
          case UILayerTypes.OGC3DTILES:
          {
            const layer =  createOGC3DTILESLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break;
          case UILayerTypes.WMSLayer:
            {
                const layer =  createWMSLayer(layerInfo);
                if (layer) resolve(layer); else reject();
            }
            break;
          case UILayerTypes.BingmapsLayer:
          {
            const layer =  createBingmapsLayer(layerInfo);
            if (layer) resolve(layer); else reject();
          }
            break
        }
    })
}
