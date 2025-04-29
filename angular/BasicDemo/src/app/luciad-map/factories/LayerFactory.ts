import {LayerType} from "@luciad/ria/view/LayerType";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer";
import {BingMapsTileSetModel} from "@luciad/ria/model/tileset/BingMapsTileSetModel";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer";
import {OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {FusionPanoramaModel} from "@luciad/ria/model/tileset/FusionPanoramaModel";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode";
import {LayerTreeVisitor} from "@luciad/ria/view/LayerTreeVisitor";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel";
import {PointCloudPointShape} from "@luciad/ria/view/style/PointCloudPointShape";
import {ScalingMode} from "@luciad/ria/view/style/ScalingMode";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer";
import {Layer} from "@luciad/ria/view/Layer";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {createBounds} from "@luciad/ria/shape/ShapeFactory";
import {Bounds} from "@luciad/ria/shape/Bounds";
import {LayerGroup} from "@luciad/ria/view/LayerGroup";
import {UrlTileSetModel} from "@luciad/ria/model/tileset/UrlTileSetModel";
import {FusionTileSetModel} from "@luciad/ria/model/tileset/FusionTileSetModel";
import {PanoramaFeaturePainterV2} from "../painters/PanoramaFeaturePainterV2";
import {Affine3DTransformation, createOffsetTransformation} from "@luciad/ria/transformation/Affine3DTransformation";
import {CustomPanoramaModel} from "../models/CustomPanoramaModel";

class LayerFactory {
    public static createBingmapsLayer(bingModel:BingMapsTileSetModel, command: any) {
        let options = {...command};
        return new Promise<RasterTileSetLayer>((resolve, reject) => {
            if (typeof options === "undefined") {
                options = {}
            }
            options.label = options.label ? options.label : "Bingmaps";
            options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
            const layer = new RasterTileSetLayer(bingModel, options);
            if (layer) {
                resolve(layer);
            } else {
                reject();
            }
        });
    }

    public static createOgc3DTilesLayer(model: OGC3DTilesModel, layerOptions: any) {
        let options = {...layerOptions};

        return new Promise<TileSet3DLayer>((resolve, reject) => {
            if (typeof options === "undefined") {
                options = {}
            }
            options.label = options.label ? options.label : "OGC 3D tiles";
            options.selectable = typeof options.selectable !== "undefined" ? options.selectable : true;
            options.transparency = typeof options.transparency !== "undefined" ? options.transparency : false;
            options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
            options.qualityFactor = typeof options.qualityFactor !== "undefined" ? options.qualityFactor : 1.0;
            options.offsetTerrain = typeof options.offsetTerrain !== "undefined" ? options.offsetTerrain : true;

         // if (options.offsetTransformation) {
         //    const defaultOffset = {x: 0, y: 0, z: 0};
         //    options.transformation = createOffsetTransformation({...defaultOffset, ...options.offsetTransformation}, model.bounds.focusPoint);
         // }

          const layer:TileSet3DLayer = new TileSet3DLayer(model, options);
          if (options.offsetTransformation) {
            const defaultOffset = {x: 0, y: 0, z: 0};
            setTimeout(()=>{
              layer.transformation = createOffsetTransformation({...defaultOffset, ...options.offsetTransformation}, model.bounds.focusPoint);
            },10000)

          }
            if (layer) {
                resolve(layer);
            } else {
                reject();
            }
        });
    }

  static async createLayerGroup(layerOptions: any) {
    let options = {...layerOptions};
    return new Promise<LayerGroup>((resolve, reject) => {
      if (typeof options === "undefined") {
        options = {};
      }
      options.label = options.label ? options.label : "New group";
      const layer = new LayerGroup(options);
      if (layer) {
        resolve(layer)
      } else {
        reject();
      }
    });
  }

    static async createHSPCLayer(model: HSPCTilesModel, layerOptions: any) {
        let options = {...layerOptions};

        return new Promise<TileSet3DLayer>((resolve, reject) => {
            if (typeof options === "undefined") {
                options = {}
            }
            options.label = options.label ? options.label : "OGC 3D tiles";
            options.isDrapeTarget = false;   // HSPC can not be used for drapping
            options.selectable = typeof options.selectable !== "undefined" ? options.selectable : false;
            options.transparency = typeof options.transparency !== "undefined" ? options.transparency : false;
            options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
            options.qualityFactor = typeof options.qualityFactor !== "undefined" ? options.qualityFactor : 1.0;
            options.offsetTerrain = typeof options.offsetTerrain !== "undefined" ? options.offsetTerrain : true;
            options.pointCloudStyle = typeof options.pointCloudStyle !== "undefined" ? options.pointCloudStyle : {pointShape: PointCloudPointShape.DISC, pointSize: {mode: ScalingMode.PIXEL_SIZE, pixelSize: 2.0}};

            const layer:TileSet3DLayer = new TileSet3DLayer(model, options);
        // layer.pointCloudStyle = {
        //     colorExpression: multiply(defaultColor(), color("rgba(255,255,255,0.99)"))
        //   };
          layer.performanceHints = {maxPointCount: 4000000};

          if (layer) {
                resolve(layer);
            } else {
                reject();
            }
        });
    }

    static async createWMSLayer(model: WMSTileSetModel, layerOptions: any) {
        return new Promise<WMSTileSetLayer>((resolve)=>{
            const layer = new WMSTileSetLayer(model, layerOptions)
            resolve(layer);
        })
    }

  static async createTMSLayer(tmsModel: UrlTileSetModel, layerOptions: any) {
    let options = {...layerOptions};
    return new Promise<RasterTileSetLayer>((resolve, reject) => {
      if (typeof options === "undefined") {
        options = {}
      }
      options.label = options.label ? options.label : "TMS layer";
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;

      const layer = new RasterTileSetLayer(tmsModel, options);
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    });
  }

  static async  createLTSLayer(elevationModel: FusionTileSetModel, layerOptions: any) {
    let options = {...layerOptions};
    return new Promise<RasterTileSetLayer>((resolve, reject) => {
      if (typeof options === "undefined") {
        options = {};
      }
      options.label = options.label ? options.label : "Elevation";
      options.layerType = options.layerType ? options.layerType : LayerType.STATIC;
      const layer = new RasterTileSetLayer(elevationModel, options);
      if (layer) {
        resolve(layer)
      } else {
        reject();
      }
    });
  }

    static async getLayerBounds(aLayer: Layer) {
        return new Promise<Bounds> ((resolve, reject) => {
            const layer = aLayer as any;
            if (typeof layer.restoreCommand !== "undefined" && layer.restoreCommand.fitBounds) {
                const fitBounds = layer.restoreCommand.fitBounds;
                const ref = getReference(layer.restoreCommand.fitBounds.reference);
                const coordinates = fitBounds.coordinates;
                const bounds = createBounds(ref, coordinates);
                resolve(bounds);
            } else {
                if (layer instanceof  FeatureLayer) {
                    if (layer.bounds) {
                      resolve(layer.bounds);
                      return;
                    }
                    const queryFinishedHandle = layer.workingSet.on("QueryFinished", () => {
                        if (layer.bounds) {
                            resolve(layer.bounds);
                        } else {
                            reject();
                        }
                        queryFinishedHandle.remove();
                    });
                } else {
                    resolve(layer.bounds);
                }
            }
        } )
    }

  static async createWFSLayer(model: FeatureModel, layerOptions: any) {
    return new Promise<FeatureLayer>((resolve)=>{
      const layer = new FeatureLayer(model, layerOptions);
      resolve(layer);
    })
  }

  static async createEditableFeatureLayer(model: FeatureModel, layerOptions: any) {
    let options = {...layerOptions};
    return new Promise<FeatureLayer>((resolve, reject)=> {
      if (typeof options !== "undefined") {
        const layer = new FeatureLayer(model, options);
        if (layer) {
          resolve(layer)
        } else {
          reject();
        }
      } else {
        reject()
      }
    })
  }

  static async createPanoramicsLayer(model: FeatureModel, layerOptions: any, modelOptions: any) {
    let options = {...layerOptions};
    return new Promise<FeatureLayer>((resolve, reject)=>{
      if (typeof options === "undefined") {
        options = {}
      }
      const target =  modelOptions.url;
      const panoModel = new FusionPanoramaModel(target, {
        credentials: modelOptions.credentials,
        requestHeaders: modelOptions.requestHeaders
      });

      const layer = new FeatureLayer(model, {
        ...options,
        panoramaModel: panoModel,
        selectable: false,
        // painter: new PanoramaFeaturePainterPlus(panoModel),
        painter:new PanoramaFeaturePainterV2({
          overview: false,
          iconHeightOffset: Number(options.iconHeightOffset) // sensor height in meters above street level (approx)
        })
      });
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    })
  }

  static async createCustomPanoramicsLayer(model: FeatureModel, layerOptions: any, modelOptions: any) {
    let options = {...layerOptions};
    return new Promise<FeatureLayer>((resolve, reject)=>{
      if (typeof options === "undefined") {
        options = {}
      }
      const target =  modelOptions.url;
      const panoramaModel = new CustomPanoramaModel(target, {
        credentials: modelOptions.credentials,
        requestHeaders: modelOptions.requestHeaders
      });

      const layer = new FeatureLayer(model, {
        ...options,
        panoramaModel,
        selectable: false,
        // painter: new PanoramaFeaturePainterPlus(panoModel),
        painter:new PanoramaFeaturePainterV2({
          overview: false,
          iconHeightOffset: Number(options.iconHeightOffset) // sensor height in meters above street level (approx)
        })
      });
      if (layer) {
        resolve(layer);
      } else {
        reject();
      }
    })
  }

  static isFusionPanoramaLayer(layer: any) {
    return layer instanceof FeatureLayer && layer.panoramaModel && layer.painter instanceof PanoramaFeaturePainterV2;
  }

  static findFusionPanoramaLayers(map: WebGLMap) {
    const layers: FeatureLayer[] = [];
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: any) => {
          if (layer instanceof FeatureLayer && layer.panoramaModel && layer.painter instanceof PanoramaFeaturePainterV2) {
            layers.push(layer);
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: any) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        }
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
    return layers;
  }
}

export {
    LayerFactory
}
