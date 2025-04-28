import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { Polygon } from '@luciad/ria/shape/Polygon';

export const BOUNDARY_BOX_OUTLINE_COLOR = '#FFFFFF';
export const OUTLINE_COLOR_OCCLUDED = 'rgba(255, 255, 255, 0.2)';
export const BOUNDARY_BOX_FILL_COLOR = 'rgba(171,232,229, 0.3)';

export interface DrawBoxOptions {
  hightlighted?: boolean;
  withOccludedPart?: boolean;
  color?: string;
}

/**
 * Draws the given box on the given canvas
 */
export function drawBox(geoCanvas: GeoCanvas, box: OrientedBox, options?: DrawBoxOptions) {
  const highlighted = !!options?.hightlighted;
  const withOccludedPart = !!options?.withOccludedPart;
  geoCanvas.drawShape(box, {
    stroke: {
      width: highlighted ? 4 : 2,
      color: options.color ?? BOUNDARY_BOX_OUTLINE_COLOR,
    },
    fill: highlighted
      ? {
          color: BOUNDARY_BOX_FILL_COLOR,
        }
      : undefined,
  });

  if (withOccludedPart) {
    geoCanvas.drawShape(box, {
      stroke: {
        width: highlighted ? 4 : 2,
        color: options.color ?? BOUNDARY_BOX_OUTLINE_COLOR,
      },
      fill: highlighted
        ? {
            color: options.color ?? BOUNDARY_BOX_OUTLINE_COLOR,
          }
        : undefined,
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
    });
  }
}

/**
 * Draws the given box face on the given canvas
 */
export function drawFacePolygon(geoCanvas: GeoCanvas, polygon: Polygon, hovered: boolean) {
  geoCanvas.drawShape(polygon, {
    stroke: {
      width: hovered ? 4 : 2,
      color: BOUNDARY_BOX_OUTLINE_COLOR,
    },
    fill: hovered
      ? {
          color: BOUNDARY_BOX_FILL_COLOR,
        }
      : undefined,
  });
}
