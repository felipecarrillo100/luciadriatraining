import * as GeodesyFactory from '@luciad/ria/geodesy/GeodesyFactory.js';
import { LineType } from '@luciad/ria/geodesy/LineType.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { Point } from '@luciad/ria/shape/Point.js';
import { Shape } from '@luciad/ria/shape/Shape.js';
import * as ShapeFactory from '@luciad/ria/shape/ShapeFactory.js';
import { createPoint } from '@luciad/ria/shape/ShapeFactory.js';
import * as TransformationFactory from '@luciad/ria/transformation/TransformationFactory.js';
import { CoordinateReference } from '@luciad/ria/reference/CoordinateReference.js';
import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { LocationMode } from '@luciad/ria/transformation/LocationMode.js';
import {CRSEnum} from '../interfaces/CRS.enum';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';

const reference = getReference(CRSEnum.CRS_84);
const GEODESY = GeodesyFactory.createSphericalGeodesy(reference);

export enum GeoToolsUnitsEnum {
  METERS = 'm',
  FEET = 'ft',
  KILOMETERS = 'km',
  MILES = 'mi',
  NAUTICALMILES = 'nm',
  YARDS = 'yd',
}

const GeoToolsUnitsMappingFactor = {} as any;

GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.METERS] = 1;
GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.KILOMETERS] = 1000;
GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.FEET] = 0.30478512648;
GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.MILES] = 1609.344;
GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.NAUTICALMILES] = 1852;
GeoToolsUnitsMappingFactor[GeoToolsUnitsEnum.YARDS] = 0.91440000028; // 0.91407678245;

class GeoTools {
  public createDiscreteCircle_SHORTEST_DISTANCE(point: Point, radius: number, slices: number) {
    const delta = 360 / slices;
    // const newPoint  = GEODESY.interpolate(point, radius, 0, LineType.SHORTEST_DISTANCE);

    let angle = 0;
    const points = [];
    for (let i = 0; i < slices; ++i) {
      const newPoint = GEODESY.interpolate(point, radius, angle, LineType.SHORTEST_DISTANCE);
      angle += delta;
      points.push(newPoint);
    }
    return ShapeFactory.createPolygon(point.reference as CoordinateReference, points);
  }

  public interpolate(p1: Point, p2: Point, fraction: number) {
    return GEODESY.interpolate(p1, p2, fraction, LineType.SHORTEST_DISTANCE);
  }

  public createGeoJSONShapeFromBounds(bounds: Bounds) {
    const points = [];
    points.push(ShapeFactory.createPoint(bounds.reference, [bounds.x, bounds.y]));
    points.push(ShapeFactory.createPoint(bounds.reference, [bounds.x + bounds.width, bounds.y]));
    points.push(ShapeFactory.createPoint(bounds.reference, [bounds.x + bounds.width, bounds.y + bounds.height]));
    points.push(ShapeFactory.createPoint(bounds.reference, [bounds.x, bounds.y + bounds.height]));
    const newShape = ShapeFactory.createPolygon(bounds.reference as CoordinateReference, points);
    return newShape;
  }

  public createBuffer(point: Point, width: number, height: number) {
    const points = [];
    const newPoint1 = GEODESY.interpolate(point, width, -90, LineType.SHORTEST_DISTANCE);
    const newPoint2 = GEODESY.interpolate(point, width, +90, LineType.SHORTEST_DISTANCE);
    const newPoint3 = GEODESY.interpolate(point, height, 0, LineType.SHORTEST_DISTANCE);
    const newPoint4 = GEODESY.interpolate(point, height, 180, LineType.SHORTEST_DISTANCE);

    points.push(ShapeFactory.createPoint(point.reference, [newPoint1.x, newPoint3.y]));
    points.push(ShapeFactory.createPoint(point.reference, [newPoint2.x, newPoint3.y]));
    points.push(ShapeFactory.createPoint(point.reference, [newPoint2.x, newPoint4.y]));
    points.push(ShapeFactory.createPoint(point.reference, [newPoint1.x, newPoint4.y]));
    // points.push(ShapeFactory.createPoint( point.reference, [newPoint1.x, newPoint3.y]));
    return ShapeFactory.createPolygon(point.reference as CoordinateReference, points);
  }

  public isNativeGeoJSONReference(testReference: CoordinateReference): boolean {
    if (
      testReference.name === 'WGS_1984' &&
      (testReference.identifier.includes('CRS84') || testReference.identifier.includes(CRSEnum.CRS_84))
    ) {
      return true;
    }
    return testReference.identifier.includes(CRSEnum.EPSG_4326);
  }

  public reprojectPoint3D(shape: Point, targetProjection?: string | CoordinateReference) {
    let targetReference;

    if (targetProjection instanceof CoordinateReference) {
      targetReference = getReference(targetProjection.identifier);

      if (shape.reference === targetReference) {
        return shape;
      } else {
        const transformer = TransformationFactory.createTransformation(
          shape.reference as CoordinateReference,
          targetReference,
        );
        const newShape = transformer.transform(shape);
        return newShape;
      }
    } else {
      // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
      targetProjection = targetProjection ? targetProjection : CRSEnum.EPSG_4326;
      targetProjection = targetProjection === CRSEnum.CRS_84 ? CRSEnum.EPSG_4326 : targetProjection;
      const sourceProjection =
        shape.reference?.name === 'WGS_1984' && shape.reference.identifier.includes('CRS84')
          ? CRSEnum.EPSG_4326
          : shape.reference?.identifier;
      targetReference = getReference(targetProjection);

      if (sourceProjection === targetProjection) {
        return shape;
      } else {
        const transformer = TransformationFactory.createTransformation(
          shape.reference as CoordinateReference,
          targetReference,
        );
        const newShape = transformer.transform(shape);
        return newShape;
      }
    }
  }

  public getScreenCoordinatesToMapCoordinates(clientX: number, clientY:number, map: WebGLMap) {
    if (!map) return null;
    try {
      const rect = map.domNode.getBoundingClientRect();
      const correctedPosition = [clientX - rect.left, clientY - rect.top];
      const viewPoint = createPoint(null, correctedPosition);
      const worldPoint = map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(viewPoint);
      const pointCrs84 = this.reprojectPoint3D(worldPoint);
      return pointCrs84;
    } catch {
      return null;
    }
  }

  public reprojectBounds(shape: Bounds, targetProjection?: string) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetProjection = targetProjection ? targetProjection : CRSEnum.EPSG_4326;
    targetProjection = targetProjection === CRSEnum.CRS_84 ? CRSEnum.EPSG_4326 : targetProjection;
    const sourceProjection =
      shape.reference?.name === 'WGS_1984' && shape.reference.identifier.includes('CRS84')
        ? CRSEnum.EPSG_4326
        : shape.reference?.identifier;
    const targetReference = getReference(targetProjection);
    if (sourceProjection === targetProjection) {
      return shape;
    } else {
      const transformer = TransformationFactory.createTransformation(
        shape.reference as CoordinateReference,
        targetReference,
      );
      const newShape = transformer.transformBounds(shape);
      return newShape;
    }
  }

  public MetersToUnits(meters: number, units: GeoToolsUnitsEnum) {
    const factor = GeoToolsUnitsMappingFactor[units];
    if (factor) {
      return meters / factor;
    } else {
      return NaN;
    }
  }

  public UnitsToMeters(value: number, units: GeoToolsUnitsEnum) {
    const factor = GeoToolsUnitsMappingFactor[units];
    if (factor) {
      return value * factor;
    } else {
      return NaN;
    }
  }

  public createBoundsFromAWGS84Bounds(cardinals: { west: number; east: number; south: number; north: number }) {
    const bounds = [
      cardinals.west,
      cardinals.east - cardinals.west,
      cardinals.south,
      cardinals.north - cardinals.south,
    ];
    const WGS84 = getReference(CRSEnum.CRS_84);
    return ShapeFactory.createBounds(WGS84, bounds);
  }

  public getCRS84BoundingBox(shape: Shape) {
    const WGS84 = getReference(CRSEnum.CRS_84);
    const bounds = shape.bounds;
    const toWgs84 = TransformationFactory.createTransformation(bounds?.reference as CoordinateReference, WGS84);
    const newbounds = toWgs84.transformBounds(bounds as Bounds);
    return {
      north: newbounds.y + newbounds.height,
      south: newbounds.y,
      west: newbounds.x,
      east: newbounds.x + newbounds.width,
    };
  }

  public reprojectPointTo(shape: Point, targetProjection?: string) {
    // When no targetProjection Specified then default to CRS:84 (EPSG:4326);
    targetProjection = targetProjection ? targetProjection : CRSEnum.EPSG_4326;
    targetProjection = targetProjection === CRSEnum.CRS_84 ? CRSEnum.EPSG_4326 : targetProjection;
    const sourceProjection =
      // @ts-ignore
      shape.reference.name === 'WGS_1984' && shape.reference.identifier.includes('CRS84')
        ? CRSEnum.EPSG_4326
        // @ts-ignore
        : shape.reference.identifier;
    if (sourceProjection === targetProjection) {
      return shape;
    } else {
      const targetReference = getReference(targetProjection);
      // @ts-ignore
      const transformer = TransformationFactory.createTransformation(shape.reference, targetReference);
      try {
        return transformer.transform(shape);
      } catch {
        return null;
      }
    }
  }
}

export default new GeoTools();
