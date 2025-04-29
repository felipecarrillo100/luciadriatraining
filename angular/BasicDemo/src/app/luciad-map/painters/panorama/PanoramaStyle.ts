import {
  Icon3DStyle,
  MeshIcon3DStyle,
} from '@luciad/ria/view/style/Icon3DStyle';
const panoFloorTexture = './assets/images/panofloor.png';
import { Mesh } from '@luciad/ria/geometry/mesh/Mesh';
import { Point } from '@luciad/ria/shape/Point';
import { Map as RIAMap } from '@luciad/ria/view/Map';
import {IconFactory} from "../../controls/ruler3d/IconFactory";
import {limitSizeInMeters} from "../../utils/SizeUtil";
import {create3DSphere} from "../../utils/simple3DMeshes";

const SLICE_COUNT = 30;
const RADIUS = 1; // in meters
const PIXEL_LIMITS = [30, 90];

// Fallback will be updated
let fallbackMash: Mesh = create3DSphere(RADIUS, SLICE_COUNT);

export function createPanoOrbMesh(image: HTMLImageElement): Mesh {
  const mesh = create3DSphere(RADIUS, SLICE_COUNT, image);
  fallbackMash = mesh;
  return mesh;
}

export function getPanoOrbStyle(
  mesh: Mesh | null,
  map: RIAMap,
  point: Point
): MeshIcon3DStyle {
  // limited orb radius
  const orbRadius = limitSizeInMeters(RADIUS, PIXEL_LIMITS, map, point);
  return getPanoOrbFaceStyle(mesh ?? fallbackMash, orbRadius);
}

function getPanoOrbFaceStyle(mesh: Mesh, orbRadius = RADIUS): MeshIcon3DStyle {
  const scale = orbRadius / RADIUS;
  return {
    mesh,
    scale: {
      x: scale,
      y: scale,
      z: scale,
    },
    translation: { z: orbRadius - RADIUS },
    rotation: { x: 180 },
    bloom: { intensity: 0.6 },
    pbrSettings: {
      lightIntensity: 0.7,
      material: { metallicFactor: 1.0 },
    },
  };
}

export function getPanoDropStyle(verticalShift = 0): Icon3DStyle {
  return {
    mesh: IconFactory.quad(panoFloorTexture),
    translation: {
      z: -verticalShift,
    },
    scale: {
      x: 0.7,
      y: 0.7,
      z: 0.7,
    },
  };
}
