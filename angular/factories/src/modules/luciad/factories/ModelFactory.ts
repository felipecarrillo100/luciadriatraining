import {HttpRequestOptions} from '@luciad/ria/util/HttpRequestOptions.js';
import {HSPCTilesModel} from '@luciad/ria/model/tileset/HSPCTilesModel.js';
import {OGC3DTilesModel} from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
import {WMSTileSetModel} from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import {FeatureModel} from '@luciad/ria/model/feature/FeatureModel.js';
import {WFSFeatureStore} from '@luciad/ria/model/store/WFSFeatureStore.js';

export class ModelFactory {

  public static createWMSModel(wmsSettings: any) {
    return new Promise<WMSTileSetModel>((resolve, reject) => {
      // Adds a WMS layer as a background
      WMSTileSetModel.createFromURL(wmsSettings.url, wmsSettings.layers, {}).then(async (model: WMSTileSetModel) => {
        resolve(model);
      }).catch(()=>{
        reject();
      });
    });
  }

  public static createOgc3DTilesModel(OGC3DTilesSettings: any) {
    return new Promise<OGC3DTilesModel>((resolve, reject) => {
      OGC3DTilesModel.create(OGC3DTilesSettings.url, OGC3DTilesSettings).then(
        (model) => {
          if (model && model.modelDescriptor && model.modelDescriptor.type === 'OGC3D') {
            resolve(model);
          } else {
            reject(null);
          }
        }
      ).catch(()=>{
          reject();
      });
    });
  }

  static async createHSPCModel(modelOptions: any) {
    return new Promise<HSPCTilesModel>((resolve, reject) => {
      HSPCTilesModel.create(modelOptions.url, modelOptions as HttpRequestOptions)
        .then((model) => {
          if (model && model.modelDescriptor && model.modelDescriptor.type === 'HSPC') {
            resolve(model);
          } else {
            reject(null);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public static createWFSModel(wfsSettings: any) {
    return new Promise<FeatureModel>((resolve, reject) => {
      // Adds a WMS layer as a background
      WFSFeatureStore.createFromURL(wfsSettings.url, wfsSettings.layer, {}).then(async (store: WFSFeatureStore) => {
        const model = new FeatureModel(store)
        resolve(model);
      }).catch(()=>{
        reject();
      });
    });
  }

}
