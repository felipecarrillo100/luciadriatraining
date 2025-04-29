export interface BoundsObject {
  reference: string;
  coordinates: number[]
}

export const ValidAssetTypeCategories = [
  "MESH",
  "POINT_CLOUD",
  "PANORAMIC"
];

export const LayeerTypeTranslate = {
  "HSPC": "HSPC",
  "OGC_3D_TILES": "OGC_3D_TILES",
  "CUBEMAP_JSON": "PANORAMIC"
}

export const isValidAssetLayerType = (address:any)=>(address.serviceType === "HSPC" || address.serviceType === "OGC_3D_TILES" || address.serviceType==="CUBEMAP_JSON");
