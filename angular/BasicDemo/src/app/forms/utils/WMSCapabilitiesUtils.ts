import {WMSCapabilitiesLayer} from "@luciad/ria/model/capabilities/WMSCapabilitiesLayer";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference";
import {WMSCapabilitiesOperation} from "@luciad/ria/model/capabilities/WMSCapabilities";
import {Bounds} from "@luciad/ria/shape/Bounds";

export class WMSCapabilitiesUtils {
  static getPreferredFormat = (outputFormats: string[]) => {
    if (outputFormats.find(e=>e==="image/png"))
      return "image/png";
    return outputFormats[0];
  }

  static getPreferredProjection = (projections: string[]) => {
    if (projections.find(e => e.toUpperCase() === "EPSG:3857"))
      return "EPSG:3857";
    return projections[0];
  }

  static simplifyBounds = (layers:WMSCapabilitiesLayer[], projection: string) => {
    let resultingBounds;
    try {
      for (const layer of layers) {
        // const bounds = layer.getBounds(ReferenceProvider.getReference("CRS:84"));
        // const bounds = layer.getBounds(ReferenceProvider.getReference("EPSG:4326"));
        const bounds = this.forceBoundsToCRS84(layer, projection);
        if (typeof resultingBounds === "undefined"){
          if (bounds) {
            resultingBounds = bounds.copy();
          }
        } else {
          if (bounds) {
            resultingBounds.setTo2DUnion(bounds);
          }
        }
      }
      const b = resultingBounds as any;
      return {reference:b.reference.identifier, coordinates:b.coordinates};
    } catch (error) {
      console.error("Missing bounds in references: CRS84 & " + projection);
      throw error;
    }
  }

  private static forceBoundsToCRS84 = (layer:WMSCapabilitiesLayer, projection: string) => {
    try {
      const bounds = layer.getBounds(getReference("EPSG:4326"));
      return bounds;
    } catch (err) {
      const boundsNative = layer.getBounds(getReference(projection)) as Bounds;
      const WGS84 = getReference("EPSG:4326");
      const toWgs84 = createTransformation(boundsNative.reference as CoordinateReference, WGS84);
      const crs84Bounds = toWgs84.transformBounds(boundsNative);
      return crs84Bounds
    }
  }

  static flattenWmsLayerHierarchy(layers: WMSCapabilitiesLayer[]): WMSCapabilitiesLayer[] {
    return layers.reduce((accumulated:WMSCapabilitiesLayer[], value) => {
      accumulated.push(value);
      if (value.children) {
        accumulated = accumulated.concat(this.flattenWmsLayerHierarchy(value.children));
      }
      return accumulated;
    }, []);
  }

  static GetMap(operations: WMSCapabilitiesOperation[]) {
    const getMap = operations.find(operation => operation.name === "GetMap");
    if  (getMap) {
      return {
        supportedFormats: getMap.supportedFormats,
        supportedRequests: (getMap as any).supportedRequests,
      }
    };
    return null;
  }
}
