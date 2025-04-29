import HandleHTTPErrors from "./HandleHTTPErrors";
import {ScreenMessageTypes} from "../../interfaces/ScreenMessageTypes";

export interface GetCapabilitiesFusionPanoramaOptions {
    requestHeaders?: any;
    credentials?: boolean;
}

export interface GetCapabilitiesFusionPanoramaResult {
    georeferenced: boolean;
    crs?: {
        properties:  {
            name: string
        }
        type: string;
    },
    features: any[];
    type: string;
}

interface PanoramaFeatureProperties {
    filename?: string;
    imageUrl?: string;
    kappa: number;
    levelCount: number;
    omega?: number;
    phi?: number;
    rotationMatrix?: number[];
    tileHeight: number;
    tileWidth: number;
    time?: number;
    type: string;
    version: string;
}

class GetCapabilitiesFusionPanorama {

    private static parseJSONFeatureCollection(json: any) {
      const nonGeoreferenced = json.crs.type === "name" && json.crs.properties.name.startsWith("urn:ogc:def:crs:WKT::LOCAL_CS");

      const tileInfo = {
            georeferenced: !nonGeoreferenced,
            crs: json.crs,
            features: json.features,
            type: json.type
        };
        return tileInfo;
    }

    public static fromURL(request: string, options: GetCapabilitiesFusionPanoramaOptions) {
        const handleHTTPErrors = new HandleHTTPErrors("Error retrieving Fusion Panorama Info", !!options.credentials);
        return new Promise<GetCapabilitiesFusionPanoramaResult>((resolve, reject) => {
            fetch(request, {
                credentials: options.credentials ? "same-origin" : "omit",
                headers: options.requestHeaders,
                method: "GET"
            }). then((response: Response)=> {
                if (response.status === 200) {
                    response.json().then( json=> {
                        const basicCapabilities = GetCapabilitiesFusionPanorama.parseJSONFeatureCollection(json);
                        if (basicCapabilities.type ===  "FeatureCollection") {
                            if (this.validateFeatures(basicCapabilities.features)) {
                                resolve(basicCapabilities);
                                return;
                            }
                        }
                        const reason = {type:ScreenMessageTypes.ERROR, message: "Error: Not a valid Fusion Panorama" };
                        reject(reason);
                    }, (e) => {
                        const reason = {type:ScreenMessageTypes.ERROR, message: `Error: Invalid JSON content`  };
                        reject(reason);
                    });
                } else {
                    const error = {
                        code : response.status,
                        message : response.statusText
                    };
                    const message = handleHTTPErrors.httpErrorDictionary(error);
                    const reason = {type:ScreenMessageTypes.ERROR, message };
                    reject(reason);
                }
            }, () => {
                const reason = {type:ScreenMessageTypes.ERROR, message: "Error retrieving Fusion Panorama Info" };
                reject(reason);
            })
        });
    }

    private static validateFeatures(features: any) {
        function validateOneFeature(p: PanoramaFeatureProperties): boolean {
            return typeof p.levelCount !== "undefined"  &&
                typeof p.tileHeight !== "undefined" &&
                typeof p.tileWidth !== "undefined" &&
                typeof p.type !== "undefined" &&
                typeof p.version !== "undefined";
        }
        let result = true;
        for (const feature of features) {
            result = result && validateOneFeature(feature.properties)
            if (result === false) break;
        }
        return result;
    }
}

export default GetCapabilitiesFusionPanorama;
