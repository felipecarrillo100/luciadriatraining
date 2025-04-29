import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel";
import {BingMapsTileSetModel} from "@luciad/ria/model/tileset/BingMapsTileSetModel";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel";
import {UrlStore} from "@luciad/ria/model/store/UrlStore";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel";
import {UrlTileSetModel} from "@luciad/ria/model/tileset/UrlTileSetModel";
import {createBounds} from "@luciad/ria/shape/ShapeFactory";
import {FusionTileSetModel} from "@luciad/ria/model/tileset/FusionTileSetModel";
import {MemoryStore} from "@luciad/ria/model/store/MemoryStore";
import {WFSFeatureStore} from "@luciad/ria/model/store/WFSFeatureStore";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec";
import {MyJSONOnlineStore} from "../stores/MyJSONOnlineStore";

class ModelFactory {
    public static createBingmapsModel(command: any) {
        return new Promise<BingMapsTileSetModel>((resolve, reject) => {
            let options = {...command};
            if (typeof options === "undefined") {
                options = {
                    imagerySet: "",
                    token: ""
                };
            }
            let template = "https://dev.virtualearth.net/REST/v1/Imagery/Metadata/%MAPID%?key=%TOKEN%&include=ImageryProviders";
            if (options.useproxy) {
                const proxyURL = "Enter Bingmaps proxy here";
                template = proxyURL +"/%MAPID%";
            }
            let requestStr = template.replace("%MAPID%", options.imagerySet);
            requestStr = requestStr.replace("%TOKEN%", options.token);

            ModelFactory.GET_JSON(requestStr).then(
                (response)=>{
                    if (response.status === 200) {
                        response.json().then(data=>{
                            let resource;
                            if (data.resourceSets[0] && data.resourceSets[0].resources[0]) {
                                resource = data.resourceSets[0].resources[0];
                                // Serve tiles over https://
                                if (resource.imageUrl.indexOf("http://ecn.") > -1) {
                                    resource.imageUrl = resource.imageUrl.replace("http:", "https:");
                                }
                                if (resource.imageUrl.indexOf("http://ak.dynamic.") > -1) {
                                    resource.imageUrl = resource.imageUrl.replace("{subdomain}.", "");
                                    resource.imageUrl = resource.imageUrl.replace("http://", "https://{subdomain}.ssl.");
                                }
                                resource.brandLogoUri = data.brandLogoUri;
                            } else {
                                resource = data;
                            }
                            const model = new BingMapsTileSetModel(resource);
                            resolve(model);
                        })
                    } else {
                        const reason = {type:"error", message:"Failed to create layer. Bing Maps service unreachable"}
                        reject(reason);
                    }
                },
                () => {
                    const reason = {type:"error", message:"Failed to create layer. Bing Maps service unreachable"}
                    reject(reason);
                }
            );
        });
    }

    public static createOgc3DTilesModel(OGC3DTilesSettings: any) {
        return new Promise<OGC3DTilesModel>((resolve, reject) => {
            OGC3DTilesModel.create(OGC3DTilesSettings.url, OGC3DTilesSettings).then((model) => {
                if (model && model.modelDescriptor && model.modelDescriptor.type === "OGC3D") {
                    resolve(model);
                } else {
                    reject(null);
                }
            }, () => {
                reject();
            });
        });
    }

    public static createPanoramicsModel(modelOptions: any) {
        return new Promise<FeatureModel>((resolve, reject)=> {
            const crs = modelOptions.crs ? modelOptions.crs : "CRS:84";
            const reference = getReference(crs);
                const store = new UrlStore({
                    target: modelOptions.url,
                    credentials: modelOptions.credentials,
                    requestHeaders: modelOptions.requestHeaders,
                    accepts: modelOptions.requestHeaders ? modelOptions.requestHeaders.Accept : undefined,
                    reference
                });
                const model = new FeatureModel(store, {
                    reference
                });
                resolve(model);
        });
    }

    public static createCustomPanoramicsModel(modelOptions: any) {
      return new Promise<FeatureModel>((resolve, reject)=> {
        const crs = modelOptions.crs ? modelOptions.crs : "CRS:84";
        const reference = getReference(crs);
        const store = new UrlStore({
          target: modelOptions.url,
          credentials: modelOptions.credentials,
          requestHeaders: modelOptions.requestHeaders,
          accepts: modelOptions.requestHeaders ? modelOptions.requestHeaders.Accept : undefined,
          reference
        });
        const model = new FeatureModel(store, {
          reference
        });
        resolve(model);
      });
    }

    private static GET_JSON_BACKEND(url: string) {
        return fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, cors, *same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer' // no-referrer, *client
        })
    }

    private static GET_JSON(url: string) {
        const requestOptions = {
            method: 'GET',
            redirect: 'follow'
        } as any;
        return fetch(url, requestOptions);
    }

    static async createHSPCModel(modelOptions: any) {
        return new Promise<HSPCTilesModel>((resolve, reject) => {
            HSPCTilesModel.create(modelOptions.url, modelOptions).then((model) => {
                if (model && model.modelDescriptor && model.modelDescriptor.type === "HSPC") {
                    resolve(model);
                } else {
                    reject(null);
                }
            }, () => {
                reject();
            });
        });
    }

    static async createWMSModel(modelOptions: any) {
        return new Promise<WMSTileSetModel>((resolve, reject)=> {
            const model = new WMSTileSetModel({
                infoFormat: modelOptions.infoFormat,
                queryLayers: modelOptions.layers,
                getMapRoot: modelOptions.getMapRoot,
                version: modelOptions.version ? modelOptions.version : "1.3.0",
                reference: getReference(modelOptions.referenceText),
                layers: modelOptions.layers,
                transparent: typeof modelOptions.transparent !== "undefined" ? modelOptions.transparent : false,
                imageFormat: typeof modelOptions.imageFormat !== "undefined" ? modelOptions.imageFormat : "image/png",
                requestHeaders: modelOptions.requestHeaders,
                requestParameters: modelOptions.requestParameters,
                credentials: modelOptions.credentials
            });
            resolve(model);
        })
    }

  static async  createWFSModel(modelOptions: any) {
    return new Promise<FeatureModel>((resolve, reject)=> {
      const options = {...modelOptions};
      const extension = (options.outputFormat.toLowerCase().indexOf("json") >= 0) ? "json" : "gml";
      // options.outputFormat = (options.outputFormat.toLowerCase().indexOf("json") >= 0) ? "application/json" : "text/xml, application/xml";
      const reference = getReference(options.referenceText);
        options.reference = reference;
        // eslint-disable-next-line no-self-assign
        options.outputFormat = options.outputFormat;
        let codecOptions = {};
        const swapAxes = [reference.identifier, "CRS:84", "EPSG:4326"];
        if (options.swapAxes) {
          codecOptions = {
            ...codecOptions, swapAxes
          }
        }
        if (options.generateIDs) {
          codecOptions = {...codecOptions, generateIDs:true}
        }
        // options.codec = CodecFactory.getFormatByName(extension).newCodec(codecOptions);
        options.codec = new GeoJsonCodec(codecOptions);
        delete options.attributionParams;

        const store = (options.swapQueryAxes) ?
          new WFSFeatureStore({...options, swapAxes}) :
          new WFSFeatureStore(options) ;

        const model = new FeatureModel(store);
        if (model) {
          resolve(model);
        } else {
          reject();
        }

    });
  }
  static async  createTMSModel(modelOptions: any) {
    return new Promise<UrlTileSetModel>((resolve) => {
      let options = {...modelOptions};

      delete options.attributionParams;

      const REF_WEBMERCATOR = getReference("EPSG:3857");
      if (typeof options === "undefined") { // If options == undefined use default WMS layer
        options = {
          baseURL: "./backgroundmap/{z}/{x}/{y}.png",
          levelCount: 18
        };
      }
      options.bounds = createBounds(REF_WEBMERCATOR, [-20037508.34278924, 40075016.68557848, -20037508.3520, 40075016.7040]);
      options.reference = REF_WEBMERCATOR;
      const model = new UrlTileSetModel(options);
      if (model) {
        resolve(model);
      }
    });
  }

  static async  createLTSModel(modelOptions: any) {
    return new Promise<FusionTileSetModel>((resolve, reject) => {
      const reference = getReference(modelOptions.referenceText);
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
          credentials: modelOptions.credentials
        });
        if (model) {
          resolve(model);
        } else {
          reject();
        }
    });
  }

  static async createMemoryFeatureModel(modelOptions: any) {
    return new Promise<FeatureModel>((resolve, reject) => {
      const reference = modelOptions.referenceText ? getReference(modelOptions.referenceText) : getReference("CRS:84");

      const store = new MemoryStore({
        reference
      });
      const model = new FeatureModel(store, {
        reference
      });
      if (model) {
        if (modelOptions.url) {
          fetch(modelOptions.url, {
            headers: modelOptions.requestHeaders,
            credentials: modelOptions.credentials ? "same-origin" : "omit",
          }).then((response)=>{
            if (response.status) {
              response.text().then(data=>{
                const codec = new GeoJsonCodec({generateIDs: true});
                const cursor = codec.decode({content:data, contentType:"json"});
                while (cursor.hasNext()) {
                  const feature = cursor.next();
                  store.add(feature);
                }
                resolve(model);
              }).catch(()=>{
                resolve(model);
              })
            } else {
              resolve(model);
            }
          }).catch(()=>{
            resolve(model);
          })
        } else {
          resolve(model);
        }
      } else {
        reject();
      }
    });
  }

  static async createMyJSONOnlineFeatureModel(modelOptions: any) {
    return new Promise<FeatureModel>((resolve, reject) => {
      const reference = modelOptions.referenceText ? getReference(modelOptions.referenceText) : getReference("CRS:84");
      const collection = modelOptions.collection ? modelOptions.collection : "";

      const store = new MyJSONOnlineStore({
        collection,
        reference
      });
      const model = new FeatureModel(store, {
        reference
      });
      if (model) {
        resolve(model);
      } else {
        reject();
      }
    });
  }


}

export {
    ModelFactory
}
