import {
  FeaturePainter,
  PaintState,
} from '@luciad/ria/view/feature/FeaturePainter';
import {GeoCanvas} from '@luciad/ria/view/style/GeoCanvas';
import {Feature} from '@luciad/ria/model/feature/Feature';
import {Shape} from '@luciad/ria/shape/Shape';
import {Layer} from '@luciad/ria/view/Layer';
import {Map} from '@luciad/ria/view/Map';
import {MeasurementPaintStyles} from '../controls/ruler3d/measurement/Measurement';
import {LabelCanvas} from '@luciad/ria/view/style/LabelCanvas';
import {OcclusionMode} from '@luciad/ria/view/style/OcclusionMode';
import {MeasurementWrapper} from "../../interfaces/MeasurementWrapper";

const rulerAnchor =  './assets/icons/rulerAnchor.svg';
const  rulerAnchorOccluded =  './assets/icons/rulerAnchorOccluded.svg';

const MAIN_LINE_COLOR = '#0693E3';
const HELPER_LINE_COLOR = '#0693E3';
const AREA_COLOR = 'rgb(152,194,60, 0.6)';

const OCCLUDED_MAIN_LINE_COLOR = 'rgba(250,250,250,0.6)';
const OCCLUDED_HELPER_LINE_COLOR = 'rgba(250,250,250,0.6)';
const OCCLUDED_AREA_COLOR = 'rgba(250,250,250,0.3)';

const HTML_LABEL_STYLE =
  'font: bold 14px sans-serif;color:white;user-select: none';

const COLLAPSED_STYLES = [
  {
    url: rulerAnchor,
    width: '40px',
    height: '40px',
    occlusionMode: OcclusionMode.VISIBLE_ONLY,
  },
  {
    url: rulerAnchorOccluded,
    width: '40px',
    height: '40px',
    occlusionMode: OcclusionMode.OCCLUDED_ONLY,
  },
];

/**
 * Measurement painting styles for the Luciad RIA Application Template measurements
 */
export const PAINT_STYLES: MeasurementPaintStyles = {
  mainLineStyles: [
    {
      stroke: {
        color: MAIN_LINE_COLOR,
        width: 2,
      },
      occlusionMode: OcclusionMode.VISIBLE_ONLY,
    },
    {
      stroke: {
        color: OCCLUDED_MAIN_LINE_COLOR,
        width: 2,
      },
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
    },
  ],
  helperLineStyles: [
    {
      stroke: {
        color: HELPER_LINE_COLOR,
        width: 2,
      },
      occlusionMode: OcclusionMode.VISIBLE_ONLY,
    },
    {
      stroke: {
        color: OCCLUDED_HELPER_LINE_COLOR,
        width: 2,
      },
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
    },
  ],
  areaStyles: [
    {
      fill: {
        color: AREA_COLOR,
      },
      occlusionMode: OcclusionMode.VISIBLE_ONLY,
    },
    {
      fill: {
        color: OCCLUDED_AREA_COLOR,
      },
      occlusionMode: OcclusionMode.OCCLUDED_ONLY,
    },
  ],
  pointStyles: [],
  mainLabelHtmlStyle: HTML_LABEL_STYLE,
  helperLabelHtmlStyle: HTML_LABEL_STYLE,
};

/**
 * Feature Painter for the Luciad RIA Application Template measurements
 */
export class MeasurementPainter extends FeaturePainter {
  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState
  ) {
    const wrapper = feature.properties["measurementWrapper"] as MeasurementWrapper;
    if (wrapper.expanded || paintState.hovered) {
      wrapper.measurement.paintBody(geoCanvas, PAINT_STYLES);
    }
    if (!wrapper.expanded) {
      for (const style of COLLAPSED_STYLES) {
        geoCanvas.drawIcon(feature.shape!, style);
      }
    }
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState
  ) {
    const wrapper = feature.properties["measurementWrapper"] as MeasurementWrapper;
    if (wrapper.expanded || paintState.hovered) {
      wrapper.measurement.paintLabel(labelCanvas, PAINT_STYLES);
    }
  }
}
