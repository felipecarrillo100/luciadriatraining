import {Bounds} from "@luciad/ria/shape/Bounds.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference.js";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory.js";


// Inspect the bounding box to get minimum and maximum height in meters over the ellipsoid
export function calculateRangeMeterEllipsoidalHeight(boundsIn: Bounds) {
    const bounds =  reprojectBounds(boundsIn, getReference("EPSG:4979")) as Bounds;
    const a = bounds.z;
    const b = bounds.z + bounds.depth;
    return {
        bounds,
        min: Math.min(a,b),
        max: Math.max(a,b)
    };
}

export function reprojectBounds(shape: Bounds, targetReference?:  CoordinateReference) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetReference =  targetReference ?  targetReference : getReference("EPSG:4326");
    const sourceReference = shape.reference;
    if ( sourceReference?.equals(targetReference)) {
        return shape;
    } else {
        const transformer = createTransformation(sourceReference!, targetReference);
        try {
            return transformer.transformBounds(shape);
        } // eslint-disable-next-line @typescript-eslint/no-unused-vars
        catch (e) {
            return null;
        }
    }
}

export function reprojectPoint(point: Point, targetReference?:  CoordinateReference) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetReference =  targetReference ?  targetReference : getReference("EPSG:4326");
    const sourceReference = point.reference;
    if ( sourceReference?.equals(targetReference)) {
        return point;
    } else {
        const transformer = createTransformation(sourceReference!, targetReference);
        try {
            return transformer.transform(point);

        } // eslint-disable-next-line @typescript-eslint/no-unused-vars
        catch (e) {
            return null;
        }
    }
}

export function calculateDistanceToEarthCenter(p: Point, height: number): number {
    const pointIn = p.copy();
    pointIn.z = height;
    // Reproject the point to the desired coordinate system;
    const point = reprojectPoint(pointIn, getReference("EPSG:4978")) as Point;

    // Calculate the distance from the Earth's center using the Euclidean distance formula
    return Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
}
