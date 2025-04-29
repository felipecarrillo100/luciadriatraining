import * as ReferenceProvider from "@luciad/ria/reference/ReferenceProvider";
import {HSPCTilesModelDescriptor} from "@luciad/ria/model/tileset/HSPCTilesModel";
import {ModelFactory} from "../../luciad-map/factories/ModelFactory";

export interface GetCapabilitiesHSPCOptions {
    requestHeaders?: any;
    credentials?: boolean;
}
const NON_REFERENCED = ReferenceProvider.getReference("LUCIAD:XYZ");

export interface GetCapabilitiesHSPCResult {
    modelDescriptor: HSPCTilesModelDescriptor;
    georeferenced: boolean;
    projection: string;
}

class GetCapabilitiesHSPC {

    public static fromURL(request: string, options: GetCapabilitiesHSPCOptions) {
        return new Promise<GetCapabilitiesHSPCResult>((resolve, reject) => {
            const model: any = {
                url: request,
                requestHeaders: options.requestHeaders,
            };
            ModelFactory.createHSPCModel(model).then(hspcModel=>{
                if (hspcModel){
                    const info = hspcModel.modelDescriptor;
                    const georeferenced = !hspcModel.reference.equals(NON_REFERENCED);
                    resolve({
                        georeferenced,
                        projection: hspcModel.reference.identifier,
                        modelDescriptor: hspcModel.modelDescriptor
                    })
                }
            })
        });
    }
}

export default GetCapabilitiesHSPC;
