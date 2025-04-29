import {
    PanoramaModel,
    PanoramaModelConstructorOptions,
    PanoramicImageTileRequest
} from "@luciad/ria/model/tileset/PanoramaModel";
import {HttpRequestOptions} from "@luciad/ria/util/HttpRequestOptions";
import {CubeMapPanoramaDescriptor, SingleImagePanoramaDescriptor} from "@luciad/ria/model/tileset/PanoramaDescriptor";
import {createPowerOfTwoStructure} from "@luciad/ria/model/tileset/PanoramaTileSetStructure";
import {PanoramaType} from "@luciad/ria/model/tileset/PanoramaType";
import {PanoramaContext} from "@luciad/ria/model/tileset/PanoramaContext";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {PanoramicImageProjectionType} from "@luciad/ria/model/tileset/PanoramicImageProjectionType";


const DefaultTileStructure = {
    level0Columns: 1,
    level0Rows: 1,
    levelCount: 1,
    tileWidth: 256,
    tileHeight: 256,
    imageDataFractionX: 1,
    imageDataFractionY: 1
};

const TILES_MAP = {
    "1": "top",
    "2": "bottom",
    "3": "front",
    "4": "back",
    "5": "left",
    "6": "right",
}

const PROJECTION_EQUIRECTANGULAR = { type: PanoramicImageProjectionType.EQUIRECTANGULAR};
const PROJECTION_PINHOLE = { type: PanoramicImageProjectionType.PINHOLE};
const DEFAULT_PROJECTION = PROJECTION_EQUIRECTANGULAR;

export class CustomPanoramaModel extends PanoramaModel {
    constructor(urlToImagesOrCubeMapJson: string, options?: HttpRequestOptions) {
        const structure = createPowerOfTwoStructure(DefaultTileStructure);
        const panoramaDescriptor: SingleImagePanoramaDescriptor = {
            projection: DEFAULT_PROJECTION,
            structure,
            type: PanoramaType.SINGLE_IMAGE
        }

        const o: PanoramaModelConstructorOptions = {
            ...options,
            panoramaDescriptor,
            baseURL: urlToImagesOrCubeMapJson,
        }
        super(o);
    }

    getBasePath(href: string) {
        return href.substring(0, href.lastIndexOf('/')) + "/";
    }

    override getPanoramaDescriptor(feature: Feature, context: PanoramaContext): CubeMapPanoramaDescriptor | SingleImagePanoramaDescriptor | null {
        const structure = feature.properties["tileStructure"] ? feature.properties["tileStructure"] : {};
        const c= super.getPanoramaDescriptor(feature, context);
        if (c) {
            const projection = feature.properties["projection"] ? (feature.properties["projection"]==="pinhole"?PROJECTION_PINHOLE: PROJECTION_EQUIRECTANGULAR) : c.projection;
            const type = feature.properties["type"] ? (feature.properties["type"]==="cubemap"?PanoramaType.CUBE_MAP:PanoramaType.SINGLE_IMAGE) : c.type;
            const newC = {...c};
            newC.structure = createPowerOfTwoStructure({...DefaultTileStructure, ...structure});
            newC.projection = projection;
            newC.type = type;
            return newC
        }
        return c;
    }

    override getPanoramicImageURL(request: PanoramicImageTileRequest): string | null {
        if (typeof request.face!== "undefined")
            return this.getPanoFromCubeMap(request);
        return this.getPanoFromSingleImage(request);
    }

    getPanoFromCubeMap (request: PanoramicImageTileRequest): string | null {
        const f  = request.face ? request.face.toString() as "1" |"2" |"3" |"4" |"5" | "6" : "1";
        const face = TILES_MAP[f];
        const url = this.getBasePath(this.baseURL);
        return `${url}${request.feature.id}/${face}-0-0-0.jpg`;
    }

    getPanoFromSingleImage (request: PanoramicImageTileRequest): string | null {
        const url = this.getBasePath(this.baseURL);
        return `${url}${request.feature.id}/tile-0-0-0.jpg`;
    }
}

