import { Vector3 } from '@luciad/ria/util/Vector3';
import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { LineType } from '@luciad/ria/geodesy/LineType';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { createSphericalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { Point } from '@luciad/ria/shape/Point';
import GeoTools from '../../../utils/GeoTools';
import { BOUNDARY_BOX_OUTLINE_COLOR } from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxDrawUtil';

enum BoxPoints {
  F1_TOP_RIGHT = 0,
  F1_BOTTOM_RIGHT = 1,
  F1_TOP_LEFT = 2,
  F1_BOTTOM_LEFT = 3,
  F2_TOP_RIGHT = 4,
  F2_BOTTOM_RIGHT = 5,
  F2_TOP_LEFT = 6,
  F2_BOTTOM_LEFT = 7,
}
export interface OrientedBoxAsJSONLegacy {
  reference: string;
  coordinates: Vector3[];
}

export interface OrientedBoxAsJSON {
  reference: string;
  center: Vector3;
  azimuth: number;
  width: number;
  height: number;
  depth: number;
  color: string;
}

// Class to save and restore OrientedBox
export class JSONBox {
  // Save the OrientedBox to a pure JSON object
  public static saveLegacy(inputBox: OrientedBox) {
    const json: OrientedBoxAsJSONLegacy = {
      reference: inputBox.reference.identifier,
      coordinates: [],
    };
    const corners = inputBox.getCorners();
    for (let r = 0; r < corners.length; r++)
      json.coordinates.push({
        x: corners[r].x,
        y: corners[r].y,
        z: corners[r].z,
      });
    return json;
  }

  // Restore OrientedBox from a JSON object
  public static createLegacy(json: OrientedBoxAsJSONLegacy) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new OrientedBox(getReference(json.reference), json.coordinates);
  }

  public static save(inputBox: OrientedBox, color: string = BOUNDARY_BOX_OUTLINE_COLOR) {
    const GEODESY = createSphericalGeodesy(inputBox.reference);
    const cornersPoints = inputBox.getCornerPoints();

    const json: OrientedBoxAsJSON = {
      reference: inputBox.reference.identifier,
      center: { x: inputBox.focusPoint.x, y: inputBox.focusPoint.y, z: inputBox.focusPoint.z },
      azimuth: GEODESY.forwardAzimuth(
        cornersPoints[BoxPoints.F2_TOP_RIGHT],
        cornersPoints[BoxPoints.F1_TOP_RIGHT],
        LineType.SHORTEST_DISTANCE,
      ),
      height: GEODESY.distance3D(
        cornersPoints[BoxPoints.F1_TOP_RIGHT],
        cornersPoints[BoxPoints.F2_TOP_RIGHT],
        LineType.SHORTEST_DISTANCE,
      ),
      width: GEODESY.distance3D(
        cornersPoints[BoxPoints.F1_TOP_RIGHT],
        cornersPoints[BoxPoints.F1_TOP_LEFT],
        LineType.SHORTEST_DISTANCE,
      ),
      depth: GEODESY.distance3D(
        cornersPoints[BoxPoints.F1_TOP_RIGHT],
        cornersPoints[BoxPoints.F1_BOTTOM_RIGHT],
        LineType.SHORTEST_DISTANCE,
      ),
      color,
    };

    return json;
  }

  public static create(jsonBox: OrientedBoxAsJSON) {
    const reference = getReference(jsonBox.reference);
    const fourPoints = (center: Point) => {
      const GEODESY = createSphericalGeodesy(center.reference);
      const height = jsonBox.height / 2;
      const width = jsonBox.width / 2;
      const f1_center = GEODESY.interpolate(center, height, jsonBox.azimuth, LineType.SHORTEST_DISTANCE);
      const f2_center = GEODESY.interpolate(center, height, jsonBox.azimuth + 180, LineType.SHORTEST_DISTANCE);

      const f1_left = GEODESY.interpolate(f1_center, width, jsonBox.azimuth + 90, LineType.SHORTEST_DISTANCE);
      const f1_right = GEODESY.interpolate(f1_center, width, jsonBox.azimuth - 90, LineType.SHORTEST_DISTANCE);

      const f2_left = GEODESY.interpolate(f2_center, width, jsonBox.azimuth + 90, LineType.SHORTEST_DISTANCE);
      const f2_right = GEODESY.interpolate(f2_center, width, jsonBox.azimuth - 90, LineType.SHORTEST_DISTANCE);

      return {
        f1: { left: f1_left, right: f1_right },
        f2: { left: f2_left, right: f2_right },
      };
    };
    const pointToVector3 = (p: Point) => {
      return { x: p.x, y: p.y, z: p.z };
    };

    const depth = jsonBox.depth / 2;
    const center = createPoint(reference, [jsonBox.center.x, jsonBox.center.y, jsonBox.center.z]);
    const dummy = GeoTools.reprojectPointTo(center);
    const topLA = createPoint(dummy.reference, [dummy.x, dummy.y, dummy.z + depth]);
    const bottomLA = createPoint(dummy.reference, [dummy.x, dummy.y, dummy.z - depth]);
    const pointTop = fourPoints(topLA);
    const pointBottom = fourPoints(bottomLA);

    const coordinatePoints = [
      pointTop.f1.right,
      pointBottom.f1.right,
      pointTop.f1.left,
      pointBottom.f1.left,
      pointTop.f2.right,
      pointBottom.f2.right,
      pointTop.f2.left,
      pointBottom.f2.left,
    ].map((c) => GeoTools.reprojectPointTo(c, reference.identifier));
    const coordinates = coordinatePoints.map((p) => pointToVector3(p));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new OrientedBox(reference, coordinates);
  }
}
