
import { HttpRequestHeaders, HttpRequestParameters } from '@luciad/ria/util/HttpRequestOptions.js';
import { URLTileSetModelConstructorOptions } from '@luciad/ria/model/tileset/UrlTileSetModel.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference.js';
import { WMSTileSetModelConstructorOptions } from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import { WFSFeatureStoreConstructorOptions } from '@luciad/ria/model/store/WFSFeatureStore.js';
import { Codec } from '@luciad/ria/model/codec/Codec.js';
import { Feature, FeatureProperties } from '@luciad/ria/model/feature/Feature.js';
import { Shape } from '@luciad/ria/shape/Shape.js';
import { RasterDataType } from '@luciad/ria/model/tileset/RasterDataType.js';
import { RasterSamplingMode } from '@luciad/ria/model/tileset/RasterSamplingMode.js';
import { CreateOGC3DTilesModelOptions } from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
// import { FilesAPI } from '@interfaces/file.interface.js';
import {UILayerTypes} from './UILayerTypes';

export interface CreateOGC3DTilesModelOptionsExtended extends CreateOGC3DTilesModelOptions {
  url: string;
}

export interface FusionTileModel {
  referenceText?: string;
  boundsObject: { reference: string; coordinates: number[] };
  coverageId: string;
  dataType?: RasterDataType;
  level0Columns?: number;
  level0Rows?: number;
  samplingMode?: RasterSamplingMode;
  tileHeight?: number;
  tileWidth?: number;
  url?: string;
  requestHeaders?: HttpRequestHeaders;
  requestParameters?: HttpRequestHeaders;
  credentials?: boolean;
}

export type FeatureModelOptions = {
  referenceText: string;
  crs: string;
  url: string;
  credentials: boolean;
  requestHeaders?: HttpRequestHeaders;
  requestParameters?: null | HttpRequestParameters;
//  properties?: FilesAPI;
};

export interface URLTileSetModelConstructorOptionsExtended extends URLTileSetModelConstructorOptions {
  levelCount?: number;
  bounds?: Bounds;
  reference?: CoordinateReference;
  attributionParams?: string;
}

export interface WMSTileSetModelConstructorOptionsExtended extends WMSTileSetModelConstructorOptions {
  queryable?: string;
  referenceText?: string;
}

export interface WFSFeatureStoreConstructorOptionsExtended extends WFSFeatureStoreConstructorOptions {
  referenceText?: string;
  outputFormat?: string;
  generateIDs?: boolean;
  codec?: Codec<Feature<Shape, FeatureProperties>>;
  attributionParams?: string;
  swapQueryAxes?: string[];
}

export interface CreateLayerInfo {
  fitBounds: unknown;
  layerType: UILayerTypes;
  model:
    | FusionTileModel
    | FeatureModelOptions
    | URLTileSetModelConstructorOptionsExtended
    | WMSTileSetModelConstructorOptionsExtended
    | WFSFeatureStoreConstructorOptionsExtended;
  layer: unknown;
  autoZoom: boolean;
}
