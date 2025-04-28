import { CreateOGC3DTilesModelOptions, OGC3DTilesModel } from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
import { BingMapsTileSetModel } from '@luciad/ria/model/tileset/BingMapsTileSetModel.js';
import { FeatureModel } from '@luciad/ria/model/feature/FeatureModel.js';
import { UrlStore } from '@luciad/ria/model/store/UrlStore.js';
import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { HSPCTilesModel } from '@luciad/ria/model/tileset/HSPCTilesModel.js';
import { WMSTileSetModel } from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import { UrlTileSetModel, URLTileSetModelConstructorOptions } from '@luciad/ria/model/tileset/UrlTileSetModel.js';
import { createBounds, createPoint } from '@luciad/ria/shape/ShapeFactory.js';
import {
  FusionTileSetModel,
  FusionTileSetModelConstructorDeprecatedOptions
} from '@luciad/ria/model/tileset/FusionTileSetModel.js';
import { MemoryStore } from '@luciad/ria/model/store/MemoryStore.js';
import { WFSFeatureStore, WFSFeatureStoreConstructorOptions } from '@luciad/ria/model/store/WFSFeatureStore.js';
import { GeoJsonCodec } from '@luciad/ria/model/codec/GeoJsonCodec.js';
import { KMLModel } from '@luciad/ria/model/kml/KMLModel.js';
import { Store } from '@luciad/ria/model/store/Store.js';
import { Feature, FeatureProperties } from '@luciad/ria/model/feature/Feature.js';
import { Shape } from '@luciad/ria/shape/Shape.js';
import { HttpRequestOptions } from '@luciad/ria/util/HttpRequestOptions.js';
import { WMSVersion } from '@luciad/ria/ogc/WMSVersion.js';
import {
  CreateOGC3DTilesModelOptionsExtended,
  FeatureModelOptions,
  FusionTileModel,
  URLTileSetModelConstructorOptionsExtended,
  WFSFeatureStoreConstructorOptionsExtended,
  WMSTileSetModelConstructorOptionsExtended,
} from '../interfaces/CreateLayerInfo';
import {CRSEnum} from '../interfaces/CRS.enum';


interface ExtendedStore extends Store<Feature<Shape, FeatureProperties>> {
  _accepts: string;
}

interface CreateOGC3DTilesModelOptionsBingmaps extends CreateOGC3DTilesModelOptions {
  imagerySet?: string;
  token?: string;
  useproxy?: unknown;
}

const MIME_KML = 'application/vnd.google-earth.kml+xml';
const MIME_KMZ = 'application/vnd.google-earth.kmz';

class ModelFactory {
  public static createBingmapsModel(command: CreateOGC3DTilesModelOptionsBingmaps) {
    return new Promise<BingMapsTileSetModel>((resolve, reject) => {
      let options = { ...command };
      if (typeof options === 'undefined') {
        options = {
          imagerySet: '',
          token: '',
        };
      }
      let template =
        'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/%MAPID%?key=%TOKEN%&include=ImageryProviders';
      if (options.useproxy) {
        const proxyURL = 'Enter Bingmaps proxy here';
        template = proxyURL + '/%MAPID%';
      }
      let requestStr = template.replace('%MAPID%', options.imagerySet!);
      requestStr = requestStr.replace('%TOKEN%', options.token!);

      ModelFactory.GET_JSON(requestStr).then(
        (response) => {
          if (response.status === 200) {
            response.json().then((data) => {
              let resource;
              if (data.resourceSets[0] && data.resourceSets[0].resources[0]) {
                resource = data.resourceSets[0].resources[0];
                // Serve tiles over https://
                if (resource.imageUrl.indexOf('http://ecn.') > -1) {
                  resource.imageUrl = resource.imageUrl.replace('http:', 'https:');
                }
                if (resource.imageUrl.indexOf('http://ak.dynamic.') > -1) {
                  resource.imageUrl = resource.imageUrl.replace('{subdomain}.', '');
                  resource.imageUrl = resource.imageUrl.replace('http://', 'https://{subdomain}.ssl.');
                }
                resource.brandLogoUri = data.brandLogoUri;
              } else {
                resource = data;
              }
              const model = new BingMapsTileSetModel(resource);
              resolve(model);
            });
          } else {
            const reason = {
              type: 'error',
              message: 'Failed to create layer. Bing Maps service unreachable',
            };
            reject(reason);
          }
        },
        () => {
          const reason = { type: 'error', message: 'Failed to create layer. Bing Maps service unreachable' };
          reject(reason);
        },
      );
    });
  }

  public static createOgc3DTilesModel(OGC3DTilesSettings: CreateOGC3DTilesModelOptionsExtended) {
    return new Promise<OGC3DTilesModel>((resolve, reject) => {
      OGC3DTilesModel.create(OGC3DTilesSettings.url, OGC3DTilesSettings).then(
        (model) => {
          if (model && model.modelDescriptor && model.modelDescriptor.type === 'OGC3D') {
            resolve(model);
          } else {
            reject(null);
          }
        },
        () => {
          reject();
        },
      );
    });
  }

  public static createPanoramicsModel(inModelOptions: FeatureModelOptions) {
    return new Promise<FeatureModel>((resolve) => {
      const crs = inModelOptions.crs ? inModelOptions.crs : CRSEnum.CRS_84;
      const reference = getReference(crs);
      const store = new UrlStore({
        target: inModelOptions.url,
        credentials: inModelOptions.credentials,
        requestHeaders: inModelOptions.requestHeaders,
        requestParameters: inModelOptions.requestParameters,
        accepts: inModelOptions.requestHeaders ? inModelOptions.requestHeaders["Accept"] : undefined,
        reference,
      });
      const memoryStore = new MemoryStore({
        reference: reference,
      });

      const modelOptions = inModelOptions as any;
      const layerId = `pano${modelOptions.properties.id}`;

      if (modelOptions?.properties) {
        modelOptions.properties.type = 'cubemap';
        modelOptions.properties['layerId'] = layerId;
      }

      store.query().then((cursor) => {
        while (cursor.hasNext()) {
          const feature = cursor.next();
          const point = createPoint(feature.shape!.reference, modelOptions.properties.location.coordinates[0][0]);

          const updatedFeature = new Feature(
            point,
            {
              ...modelOptions.properties,
              ...feature.properties,
              externalPanorama: !modelOptions?.properties,
              layerId,
            },
            feature.id,
          );
          memoryStore.add(updatedFeature);
        }
      });

      const model = new FeatureModel(memoryStore, { reference });
      // @ts-ignore
      model['layerId'] = layerId;
      resolve(model);
    });
  }

  // private static GET_JSON_BACKEND(url: string) {
  //   return fetch(url, {
  //     method: 'GET', // *GET, POST, PUT, DELETE, etc.
  //     mode: 'cors', // no-cors, cors, *same-origin
  //     cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  //     credentials: 'same-origin', // include, *same-origin, omit
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     redirect: 'follow', // manual, *follow, error
  //     referrer: 'no-referrer', // no-referrer, *client
  //   });
  // }

  private static GET_JSON(url: string) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    } as RequestInit;
    return fetch(url, requestOptions);
  }

  static async createHSPCModel(modelOptions: CreateOGC3DTilesModelOptionsExtended) {
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

  static async createWMSModel(modelOptions: WMSTileSetModelConstructorOptionsExtended) {
    return new Promise<WMSTileSetModel>((resolve) => {
      const model = new WMSTileSetModel({
        infoFormat: modelOptions.infoFormat,
        queryLayers: modelOptions.queryable ? modelOptions.layers : undefined,
        getMapRoot: modelOptions.getMapRoot,
        version: modelOptions.version ? modelOptions.version : ('1.3.0' as WMSVersion),
        reference: getReference((modelOptions as any).referenceText),
        layers: modelOptions.layers,
        transparent: typeof modelOptions.transparent !== 'undefined' ? modelOptions.transparent : false,
        imageFormat: typeof modelOptions.imageFormat !== 'undefined' ? modelOptions.imageFormat : 'image/png',
        requestHeaders: modelOptions.requestHeaders,
        requestParameters: modelOptions.requestParameters,
        credentials: modelOptions.credentials,
      });
      resolve(model);
    });
  }

  static async createWFSModel(modelOptions: WFSFeatureStoreConstructorOptionsExtended) {
    return new Promise<FeatureModel>((resolve, reject) => {
      const options = { ...modelOptions };
      // const extension = options.outputFormat.toLowerCase().indexOf('json') >= 0 ? 'json' : 'gml';
      // options.outputFormat = (options.outputFormat.toLowerCase().indexOf("json") >= 0) ? "application/json" : "text/xml, application/xml";
      const reference = getReference((options as any).referenceText);
      options.reference = reference;
      let codecOptions = {};
      const swapAxes = [reference.identifier, CRSEnum.CRS_84, CRSEnum.EPSG_4326];
      if (options.swapAxes) {
        codecOptions = {
          ...codecOptions,
          swapAxes,
        };
      }
      if (options.generateIDs) {
        codecOptions = { ...codecOptions, generateIDs: true };
      }
      // options.codec = CodecFactory.getFormatByName(extension).newCodec(codecOptions);
      options.codec = new GeoJsonCodec(codecOptions);
      delete options.attributionParams;

      const store = options.swapQueryAxes
        ? new WFSFeatureStore({ ...options, swapAxes })
        : new WFSFeatureStore(options as WFSFeatureStoreConstructorOptions);

      const model = new FeatureModel(store);
      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }

  static async createTMSModel(modelOptions: URLTileSetModelConstructorOptionsExtended) {
    return new Promise<UrlTileSetModel>((resolve) => {
      let options = { ...modelOptions };

      delete options.attributionParams;

      const REF_WEBMERCATOR = getReference('EPSG:3857');
      if (typeof options === 'undefined') {
        // If options == undefined use default WMS layer
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options = {
          baseURL: './backgroundmap/{z}/{x}/{y}.png',
          levelCount: 18,
        };
      }
      options.bounds = createBounds(
        REF_WEBMERCATOR,
        [-20037508.34278924, 40075016.68557848, -20037508.352, 40075016.704],
      );
      options.reference = REF_WEBMERCATOR;
      const model = new UrlTileSetModel(options as URLTileSetModelConstructorOptions);
      if (model) {
        resolve(model);
      }
    });
  }

  static async createLTSModel(modelOptions: FusionTileModel) {
    return new Promise<FusionTileSetModel>((resolve, reject) => {
      const reference = getReference((modelOptions as any).referenceText);
      const referenceBounds = getReference(modelOptions.boundsObject.reference);
      const model = new FusionTileSetModel({
        coverageId: modelOptions.coverageId,
        reference: reference,
        bounds: createBounds(referenceBounds, modelOptions.boundsObject.coordinates),
        dataType: modelOptions.dataType,
        level0Columns: modelOptions.level0Columns,
        level0Rows: modelOptions.level0Rows,
        levelCount: 22,
        samplingMode: modelOptions.samplingMode,
        tileHeight: modelOptions.tileHeight,
        tileWidth: modelOptions.tileWidth,
        url: modelOptions.url,
        requestHeaders: modelOptions.requestHeaders,
        requestParameters: modelOptions.requestParameters,
        credentials: modelOptions.credentials,
      } as FusionTileSetModelConstructorDeprecatedOptions);
      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }

  static async createMemoryFeatureModel(modelOptions: { referenceText?: string }) {
    return new Promise<FeatureModel>((resolve, reject) => {
      const reference = modelOptions.referenceText
        ? getReference(modelOptions.referenceText)
        : getReference(CRSEnum.CRS_84);

      const store = new MemoryStore({
        reference,
      });
      const model = new FeatureModel(store, {
        reference,
      });
      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }


  static async createKMLModel(modelOptions: any) {
    return new Promise<KMLModel>((resolve, reject) => {
      let options = { ...modelOptions };
      if (typeof options === 'undefined') {
        // If options == undefined use default KML layer
        options = {
          url: '',
        };
      }

      let requestHeaderAccept = '';
      if (modelOptions.requestHeaders && modelOptions.requestHeaders.Accept)
        requestHeaderAccept = modelOptions.requestHeaders.Accept;
      const model = new KMLModel(options.url);
      const accepts = `${MIME_KML};${MIME_KMZ};`;
      const store = model.store as ExtendedStore;
      store._accepts = accepts + requestHeaderAccept;

      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }

  static async createSlicingBoxModel(modelOptions: { referenceText: string; crs: string }) {
    return new Promise<FeatureModel>((resolve, reject) => {
      modelOptions.referenceText = modelOptions.crs ? modelOptions.crs : modelOptions.referenceText;
      const reference = modelOptions.referenceText
        ? getReference(modelOptions.referenceText)
        : getReference(CRSEnum.CRS_84);

      const store = new MemoryStore({
        reference,
      });
      const model = new FeatureModel(store, {
        reference,
      });
      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }
}

export { ModelFactory };
