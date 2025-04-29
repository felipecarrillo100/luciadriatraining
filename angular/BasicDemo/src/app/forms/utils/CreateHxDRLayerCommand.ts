import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {AppSettings} from "../../settings/AppSettings";
import {TileLoadingStrategy} from "@luciad/ria/view/tileset/TileSet3DLayer";
import GetCapabilities3DTiles from "./GetCapabilities3DTiles";
import GetCapabilitiesHSPC from "./GetCapabilitiesHSPC";
import GetCapabilitiesFusionPanorama from "./GetCapabilitiesFusionPanorama";
import {LTSCapabilities} from "@luciad/ria/model/capabilities/LTSCapabilities";
import {LTSCapabilitiesCoverage} from "@luciad/ria/model/capabilities/LTSCapabilitiesCoverage";
import {WMSCapabilities} from "@luciad/ria/model/capabilities/WMSCapabilities";
import {WMSCapabilitiesUtils} from "./WMSCapabilitiesUtils";
import {WFSCapabilities} from "@luciad/ria/model/capabilities/WFSCapabilities";
import {WFSCapabilitiesUtils} from "./WFSCapabilitiesUtils";
import {Apollo} from "apollo-angular";
import {HxDrGetAssetDetailsV2} from "../../graphql/graphql.queries";
import {BoundsObject, LayeerTypeTranslate, ValidAssetTypeCategories} from "./HcDRLayerInterfaces";

export interface ArtifactSimplified {
  "type": "POINT_CLOUD" | "PANORAMIC" | "MESH";
  "addresses": any;
  artifactId: string;
}

export interface LayerInfoHxDR {
  id: string;
  name: string;
  type: "HSPC" | "PANORAMIC" | "OGC_3D_TILES" | "LTS" | "WFS" | "WMS";
  artifactId?:string;
  addressId?: string;
  endpoint: string;
}

const autoZoom= true;

export function FindHxDRAssetEndPoint(apollo: Apollo, layerInfoHxDR: LayerInfoHxDR) {
  return new Promise<any[]>((resolve,reject)=>{
    apollo.query({
      query: HxDrGetAssetDetailsV2,
      variables: {id: layerInfoHxDR.id},
      fetchPolicy: "network-only"
    }).subscribe((response:any)=> {
      if (response.data.asset.__typename==="AssetErrorOperationNotAllowedOutput") {
        reject();
        return;
      }
      const contents = response.data.asset.asset.artifactsV2.contents.filter((item:any)=>{
        if (!ValidAssetTypeCategories.includes(item.dataCategory)) return false;
        // @ts-ignore
        return item.addressesV2.contents.some((address:any)=>LayeerTypeTranslate[address.serviceType] === layerInfoHxDR.type);
      });
      if (contents.length>0) {
        const artifact = layerInfoHxDR.artifactId ?
          contents.find((artifact:any)=>artifact.id === layerInfoHxDR.artifactId) :
          contents[0];
        if (artifact) {
          // @ts-ignore
          const address = artifact.addressesV2.contents.filter((address:any)=>LayeerTypeTranslate[address.serviceType] === layerInfoHxDR.type);
          if (address.length>0) {
            resolve(address)
            return;
          }
        }
      }
      reject();
    })
  });
}

export function CreateHxDRLayerFromProjectAssetCommand(apollo: Apollo, layerInfoHxDR: LayerInfoHxDR) {
  return new Promise<UICommand | null>(resolve=>{
    FindHxDRAssetEndPoint(apollo, layerInfoHxDR).then(addresses=> {
      if (addresses.length>0) {
        const found = layerInfoHxDR.addressId ? addresses.find(l=>l.id===layerInfoHxDR.addressId) : addresses[0];
        if (found) {
          const newLayerInfoHxDR = {...layerInfoHxDR};
          newLayerInfoHxDR.endpoint = found.endpoint;
          CreateHxDRLayerCommand(newLayerInfoHxDR).then(command=>{
            resolve(command);
          })
        }
      }
    }, ()=>{
      resolve(null);
    })
  })
}

export function CreateHxDRLayerCommand(layerInfoHxDR:LayerInfoHxDR) {
  return new Promise<UICommand>((resolve, reject) => {
    switch (layerInfoHxDR.type) {
      case "PANORAMIC":
        CreateNewPanoramicCommand(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
      // case "MESH":
      case "OGC_3D_TILES":
        CreateNewOGC3DTiles(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
      case "HSPC":
      // case "POINT_CLOUD":
        CreateNewHSPC(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
      case "LTS":
        CreateNewLTS(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
      case "WMS":
        CreateNewWMS(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
      case "WFS":
        CreateNewWFS(layerInfoHxDR).then(command=>resolve(command), ()=>reject())
        break;
    }
  })
}

function CreateNewPanoramicCommand(layerInfo: LayerInfoHxDR) {
  return new Promise<UICommand>((resolve, reject) => {
    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const panoModelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }

    GetCapabilitiesFusionPanorama.fromURL(panoModelOptions.url, panoModelOptions).then(capabilities=>{
      if (capabilities.georeferenced){
        console.log(`Panorama: ${layerInfo.name}, Projection: ${capabilities.crs?.properties.name}`);

        const panoLayerOptions = {
          "iconHeightOffset": 1,
          "editable": false,
          "selectable": false,
          "label": layerInfo.name,
          "visible": true,
        };

        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            layerType: UILayerTypes.PanoramicLayer,
            model: panoModelOptions,
            layer: panoLayerOptions,
            autoZoom
          },
        }
        resolve(command);
      } else {
        console.log("Panoramic Layer is not geroreferenced: " + layerInfo.name);
        reject();
      }
    })
  })
}

function CreateNewHSPC(layerInfo: LayerInfoHxDR) {
  return new Promise<UICommand>((resolve, reject) => {

    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const modelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }
    GetCapabilitiesHSPC.fromURL(modelOptions.url, modelOptions).then(capabilities=>{
      if (capabilities.georeferenced) {
        console.log(`HSPC: ${layerInfo.name}, Projection: ${capabilities.projection}`);
        const layerOptions = {
          "selectable": false,
          "transparency": false,
          "idProperty": "FeatureID",
          "label": layerInfo.name,
          "offsetTerrain": true,
          "qualityFactor": 1.5,
          qualityFactorDistanceFalloff: {
            farDistance:1,
            farQualityFactorMultiplier:1.5,
            nearDistance:0
          },
          // pointCloudStyle: {
          //   pointShape: "DISC",
          //   pointSize: {mode: 'ADAPTIVE_WORLD_SIZE', worldScale: 1, minimumPixelSize: 1}
          // },
          loadingStrategy: TileLoadingStrategy.OVERVIEW_FIRST,
        }
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            layerType: UILayerTypes.HSPCLayer,
            model: modelOptions,
            layer: layerOptions,
            autoZoom
          },
        }
        resolve(command);
      } else {
        console.log("HSPC Layer is not geroreferenced: " + layerInfo.name);
        reject();
      }
    })
  });
}

function CreateNewLTS(layerInfo: LayerInfoHxDR) {
  function getLayerBounds (layer: LTSCapabilitiesCoverage){
    const e: BoundsObject = {
      coordinates:[], reference:""
    }
    const bounds = layer.getBounds();
    if (bounds && bounds.reference) {
      const r : BoundsObject = {
        coordinates: [bounds.x, bounds.width, bounds.y, bounds.height],
        reference: bounds.reference.identifier
      }
      return r;
    }
    return e;
  }
  return new Promise<UICommand>((resolve, reject) => {

    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const modelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }
    LTSCapabilities.fromURL(modelOptions.url, modelOptions).then(capabilities=>{
      if (capabilities.coverages.length===1) {
        const cleanUrl = modelOptions.url.split('?')[0];
        const queryString = modelOptions.url.split('?')[1];
        let signature = undefined;

        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          signature = urlParams.get("signature") ? urlParams.get("signature") : undefined;
        }

        const coverage = capabilities.coverages[0];
        const model = {
          ...modelOptions,
            url: cleanUrl,
            coverageId: coverage.id,
            referenceText: coverage.referenceName,
            boundsObject: getLayerBounds(coverage),
            level0Columns: coverage.level0Columns,
            level0Rows: coverage.level0Rows,
            tileWidth: coverage.tileWidth,
            tileHeight: coverage.tileHeight,
            dataType: coverage.type,
            samplingMode: coverage.samplingMode,
            requestParameters: {
              signature
            }
          };
        const layer = {
          label: coverage.name
        }
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            layerType: UILayerTypes.LTSLayer,
            model,
            layer,
            autoZoom
          },
        }
        resolve(command);
      }
    })
  });
}

function CreateNewWMS(layerInfo: LayerInfoHxDR) {

  return new Promise<UICommand>((resolve, reject) => {

    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const modelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }
    WMSCapabilities.fromURL(modelOptions.url, modelOptions).then(capabilities=>{
      if (capabilities.layers.length===1 && capabilities.layers[0].children.length===1) {
        const roootLayer = capabilities.layers[0];
        const cleanUrl = modelOptions.url.split('?')[0];
        const queryString = modelOptions.url.split('?')[1];
        let signature = undefined;

        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          signature = urlParams.get("signature") ? urlParams.get("signature") : undefined;
        }

        const getMap = WMSCapabilitiesUtils.GetMap(capabilities.operations);
        let format= "image/png";
        if (getMap) {
          format = WMSCapabilitiesUtils.getPreferredFormat(getMap.supportedFormats);
        }

        const layerInfo = capabilities.layers[0].children[0];
        const referenceText = WMSCapabilitiesUtils.getPreferredProjection(roootLayer.supportedReferences);
        const model = {
          ...modelOptions,
          getMapRoot: cleanUrl,
          layers: layerInfo.name,
          referenceText,
          transparent: true,
          version: capabilities.version,
          imageFormat: format,
          requestParameters: {
            signature
          }
        };
        const unionBounds = WMSCapabilitiesUtils.simplifyBounds([layerInfo], referenceText);
        const layer = {
          label: layerInfo.name
        }
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            fitBounds: unionBounds,
            layerType: UILayerTypes.WMSLayer,
            model,
            layer,
            autoZoom
          },
        }
        resolve(command);
      }
    })
  });
}

function CreateNewWFS(layerInfo: LayerInfoHxDR) {

  return new Promise<UICommand>((resolve, reject) => {

    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const modelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }
    WFSCapabilities.fromURL(modelOptions.url, modelOptions).then(capabilities=>{
      if (capabilities.featureTypes.length===1) {
        const cleanUrl = modelOptions.url.split('?')[0];
        const queryString = modelOptions.url.split('?')[1];
        let signature = undefined;

        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          signature = urlParams.get("signature") ? urlParams.get("signature") : undefined;
        }

        const layerInfo = capabilities.featureTypes[0];
        const referenceText = layerInfo.defaultReference;
        const model = {
          ...modelOptions,
          generateIDs: false,
          outputFormat: WFSCapabilitiesUtils.getPreferredFormat(layerInfo.outputFormats),
          swapAxes: false,
          swapQueryAxes: false,
          serviceURL: cleanUrl,
          postServiceURL: cleanUrl,
          referenceText,
          typeName: layerInfo.name,
          versions: [capabilities.version],
          methods: ["POST"],
          requestParameters: {
            signature
          }
        };
        const layer = {
          label: layerInfo.title,
          visible: true
        }
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            layerType: UILayerTypes.WFSLayer,
            model,
            layer,
            autoZoom
          },
        }
        resolve(command);
      }
    })
  });
}


function CreateNewOGC3DTiles(layerInfo: LayerInfoHxDR) {
  return new Promise<UICommand>((resolve, reject) => {

    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();

    const modelOptions = {
      "HxDRAuth": {
        "assetId": layerInfo.id
      },
      "url": `${baseUrl}${layerInfo.endpoint}`,
      "credentials": false,
      "requestHeaders": {
        "Authorization": `Bearer ${accessToken}`
      }
    }
    GetCapabilities3DTiles.fromURL(modelOptions.url, modelOptions).then(capabilities=>{
      if (capabilities.georeferenced) {
        console.log(`Mesh: ${layerInfo.name}, Projection: ${capabilities.projection}`);
        const layerOptions = {
          "selectable": false,
          "transparency": true,
          "idProperty": "FeatureID",
          "loadingStrategy": {
            "0": "DETAIL_FIRST",
            "1": "OVERVIEW_FIRST",
            "DETAIL_FIRST": 0,
            "OVERVIEW_FIRST": 1
          },
          "label": layerInfo.name,
          "offsetTerrain": true,
          "qualityFactor": 0.5,
        }
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: {
            layerType: UILayerTypes.OGC3DTILES,
            model: modelOptions,
            layer: layerOptions,
            autoZoom
          },
        }
        resolve(command);
      } else {
        console.log("OGC 3D TilesLayer is not geroreferenced: " + layerInfo.name);
        reject();
      }
    })
  });
}

