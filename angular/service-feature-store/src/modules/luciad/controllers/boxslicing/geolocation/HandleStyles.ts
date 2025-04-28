import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
// import {IconFactory} from "../IconFactory"
import { ShapeStyle } from '@luciad/ria/view/style/ShapeStyle';
import IconImageFactory from '@pages/map/luciad-map/utils/iconimagefactory/IconImageFactory';

export const NORMAL_COLOR = 'white';
export const OCCLUDED_COLOR = 'rgba(255,255,255,0.1)';

export const START_POINT_STYLE: IconStyle = {
  image: IconImageFactory.circle({
    fill: 'rgb(36, 36, 36)',
    width: 18,
    height: 18,
    stroke: 'rgb(255, 255, 255)',
    strokeWidth: 2,
  }),
  width: `${18}px`,
  height: `${18}px`,
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
};

export const END_POINT_STYLE: IconStyle = {
  image: IconImageFactory.circle({
    fill: 'rgb(255, 255, 255)',
    width: 18,
    height: 18,
    stroke: 'rgb(255, 255, 255)',
    strokeWidth: 2,
  }),
  width: `${18}px`,
  height: `${18}px`,
  occlusionMode: OcclusionMode.ALWAYS_VISIBLE,
};

export const MAIN_STROKE_STYLE: ShapeStyle = {
  stroke: { color: NORMAL_COLOR, width: 3 },
  occlusionMode: OcclusionMode.VISIBLE_ONLY,
};
export const MAIN_STROKE_OCCLUDED_STYLE: ShapeStyle = {
  stroke: { color: OCCLUDED_COLOR, width: 3 },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

export const MAIN_FILLED_STYLE: ShapeStyle = {
  stroke: { color: NORMAL_COLOR, width: 2 },
  fill: { color: 'rgba(255,255,255,0.5)' },
  occlusionMode: OcclusionMode.VISIBLE_ONLY,
};
export const MAIN_FILLED_OCCLUDED_STYLE: ShapeStyle = {
  stroke: { color: OCCLUDED_COLOR, width: 2 },
  fill: { color: 'rgba(255,255,255,0.2)' },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};

export const HELPER_LINES_STYLE: ShapeStyle = {
  stroke: { color: NORMAL_COLOR, width: 1 },
  occlusionMode: OcclusionMode.VISIBLE_ONLY,
};
export const HELPER_LINES_OCCLUDED_STYLE: ShapeStyle = {
  stroke: { color: OCCLUDED_COLOR, width: 1 },
  occlusionMode: OcclusionMode.OCCLUDED_ONLY,
};
