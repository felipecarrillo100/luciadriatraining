import {WFSCapabilitiesFeatureType} from "@luciad/ria/model/capabilities/WFSCapabilitiesFeatureType";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";

export class WFSCapabilitiesUtils {
  static getPreferredFormat(outputFormats: string[]) {
    if (outputFormats.find(e=>e==="application/json"))
      return "application/json";
    return outputFormats[0];
  }

  static simplifyBounds(currentFeatureType: WFSCapabilitiesFeatureType) {
    const defaultReference = getReference("CRS:84")

    const boundsArray = currentFeatureType.getWGS84Bounds();
    if (boundsArray.length>0 &&  boundsArray[0].reference) {
      const b = [boundsArray[0].x, boundsArray[0].width, boundsArray[0].y, boundsArray[0].height];
      return {coordinates: b, reference:boundsArray[0].reference.identifier};
    } else {
      const b = [-180, 360, -90, 180];
      return {coordinates: b, reference:"CRS:84"};
    }
  }

}
