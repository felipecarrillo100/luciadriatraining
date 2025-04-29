import {OGC3DTilesModel, OGC3DTilesModelDescriptor} from "@luciad/ria/model/tileset/OGC3DTilesModel";
import * as ReferenceProvider from "@luciad/ria/reference/ReferenceProvider";
import {ModelFactory} from "../../luciad-map/factories/ModelFactory";
import {ScreenMessageTypes} from "../../interfaces/ScreenMessageTypes";
import HandleHTTPErrors from "./HandleHTTPErrors";

export interface GetCapabilities3DTilesOptions {
    requestParameters?: any;
    requestHeaders?: any;
    credentials?: boolean;
}
const NON_REFERENCED = ReferenceProvider.getReference("LUCIAD:XYZ");

export interface GetCapabilities3DTilesResult {
    tileInfo: {
        asset: {
            version:string;
            tilesetVersion:string;
        };
        geometricError:number;
        refine:string;
        type: TilesType,
    },
    modelDescriptor: OGC3DTilesModelDescriptor;
    georeferenced: boolean;
    projection: string;
}

type TilesType= "unknown" | "3DMesh" | "PointCloud";

class GetCapabilities3DTiles {

    private static detectType(node: any): TilesType {
        if (typeof node === "undefined") return "unknown";
        if (typeof node.content !== "undefined") {
            let url = "";
            if (typeof node.content.url !== "undefined") {
                url = node.content.url.toLowerCase();
            } else if (typeof node.content.uri !== "undefined") {
                url = node.content.uri.toLowerCase();
            }
            if (url.endsWith(".b3dm")) {
                return "3DMesh";
            } else if (url.endsWith(".pnts")) {
                return "PointCloud";
            } else {
                return "unknown";
            }
        } else {
            if (node.children && node.children.length > 0) {
                for (let i =0; i<node.children.length; ++i) {
                    const resultValue = GetCapabilities3DTiles.detectType(node.children[0]);
                    if (resultValue!=="unknown") {
                        return resultValue;
                    }
                }
                return "unknown";
            } else {
                return "unknown";
            }
        }
    }
    private static parseJOSN3DTiles(json: any) {
        const type = GetCapabilities3DTiles.detectType(json.root)
        const tileInfo = {
            asset: json.asset,
            geometricError: json.geometricError,
            refine: json.root ? json.root.refine : undefined,
            type
        };
        return tileInfo;
    }

    public static retrieveModelDescriptor(url: string, options: any) {
        const model: any = {
            url,
            credentials: options.credentials,
            requestHeaders: options.requestHeaders
        };
        return ModelFactory.createOgc3DTilesModel(model);
    }

    public static fromURL(request: string, options: GetCapabilities3DTilesOptions) {
        const handleHTTPErrors = new HandleHTTPErrors("Error retrieving OGC Tiles Info", !!options.credentials);
        return new Promise<GetCapabilities3DTilesResult>((resolve, reject) => {
            fetch(request, {
                credentials: options.credentials ? "same-origin" : "omit",
                headers: options.requestHeaders,
                method: "GET"
            }). then((response: Response)=> {
                if (response.status === 200) {
                    response.json().then( json=> {
                        const basicCapabilities = GetCapabilities3DTiles.parseJOSN3DTiles(json);
                        const modelPromise = GetCapabilities3DTiles.retrieveModelDescriptor(request, options);
                        modelPromise.then((model:OGC3DTilesModel)=> {
                            const georeferenced = !model.reference.equals(NON_REFERENCED);
                            const response = {
                                tileInfo: basicCapabilities,
                                modelDescriptor: model.modelDescriptor,
                                georeferenced,
                                projection: model.reference.identifier
                            }
                            resolve(response);
                        }, (e: any) => {
                            const reason = {type:ScreenMessageTypes.ERROR, message: "Error retrieving OGC 3D Tiles Info" };
                            reject(reason);
                        })
                    }, (e) => {
                        const reason = {type:ScreenMessageTypes.ERROR, message: "Error: Invalid JSON content" };
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
                const reason = {type:ScreenMessageTypes.ERROR, message: "Error retrieving OGC 3D Tiles Info" };
                reject(reason);
            })
        });
    }
}

export default GetCapabilities3DTiles;
