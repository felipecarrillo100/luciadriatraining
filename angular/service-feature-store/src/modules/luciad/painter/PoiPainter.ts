import { FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter.js';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { ShapeType } from '@luciad/ria/shape/ShapeType.js';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { OnPathLabelStyle } from '@luciad/ria/view/style/OnPathLabelStyle';
import { InPathLabelStyle } from '@luciad/ria/view/style/InPathLabelStyle';
import { IconFactory } from '../controllers/ruler3d/IconFactory';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget.js';
import { Point } from '@luciad/ria/shape/Point';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
}  from '../../../app/services/performance-settings.service';
import { getIconOccludedStyle, getUOMStyle } from './iconstyler/IconsStyleProvider';

const AStyle = {
  selected: {
    lineStyle: {
      drapeTarget: DrapeTarget.ALL,
      stroke: {
        color: 'rgb(0,255,21)',
        dashIndex: 'solid',
        width: 2,
      },
    },
    shapeStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      fill: {
        color: 'rgba(70,70,65,0.8)',
      },
      stroke: {
        color: 'rgb(0, 255, 21)',
        dashIndex: 'solid',
        width: 2,
      },
    },
    pointStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      image: IconFactory.circle({
        fill: 'rgba(255,0,0,1)',
        stroke: 'rgba(255,255,255,1)',
        width: 15,
        height: 15,
      }),
      width: '64px',
      height: '64px',
      anchorY: '80%',
    },
  },
  default: {
    lineStyle: {
      drapeTarget: DrapeTarget.ALL,
      stroke: {
        color: 'rgb(0, 128, 256)',
        dashIndex: 'solid',
        width: 2,
      },
    },
    shapeStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      fill: {
        color: 'rgba(70,70,65,0.6)',
      },
      stroke: {
        color: 'rgb(0, 128, 256)',
        dashIndex: 'solid',
        width: 2,
      },
    },
    pointStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      image: IconFactory.circle({
        fill: 'rgba(255,0,0,1)',
        stroke: 'rgba(255,255,255,1)',
        width: 10,
        height: 10,
      }),
      width: '64px',
      height: '64px',
      anchorY: '80%',
    },
  },
};

export const LineGeometries = [
  ShapeType.ARC,
  ShapeType.CIRCULAR_ARC,
  ShapeType.CIRCULAR_ARC_BY_3_POINTS,
  ShapeType.CIRCULAR_ARC_BY_BULGE,
  ShapeType.CIRCULAR_ARC_BY_CENTER_POINT,
  ShapeType.POLYLINE,
];

export class PoiPainter extends FeaturePainter {
  protected iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;

  constructor() {
    super();
  }

  public setIconVisibilityMode(iconVisibilityMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = iconVisibilityMode;
  }

  getDetailLevelScales(): number[] | null {
    return [1 / 1000];
  }

  protected styleSelection(feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    let style;
    if (paintState.selected) {
      style = AStyle.selected;
    } else {
      style = AStyle.default;
    }
    return style;
  }
  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    const style = this.styleSelection(feature, shape, layer, map, paintState);
    if (shape.type === ShapeType.SHAPE_LIST) {
      const MyShape = shape as unknown as { geometries: Shape[] };
      for (const geometry of MyShape.geometries) {
        this.paintBody(geoCanvas, feature, geometry, layer, map, paintState);
      }
    } else if (shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) {
      const point = shape.focusPoint;
      // Draw icon on focus point
      if (feature.properties && (feature.properties as { icon: string }).icon) {
        const icon = (feature.properties as { icon: string }).icon;
        this.drawIconPlus(geoCanvas, point, { ...style.pointStyle, image: undefined, url: icon });
      } else {
        const pointStyle = { ...style.pointStyle };
        this.drawIconPlus(geoCanvas, point, pointStyle);
      }

      if (shape.type === ShapeType.POLYGON && paintState.selected) {
        geoCanvas.drawShape(shape, style.shapeStyle);
      }
    } else if (LineGeometries.includes(shape.type)) {
      geoCanvas.drawShape(shape, style.lineStyle);
    }
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if (paintState.level !== 1) return;

    const label = feature.properties['name'];
    let cssStyle = 'color: white;';
    cssStyle += 'white-space: nowrap;';
    // cssStyle += 'font: italic 12';
    const labelHTML = '<span style="' + cssStyle + '">' + label + '</span>';

    if ((shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) && shape.focusPoint) {
      labelCanvas.drawLabel(labelHTML, shape.focusPoint, {} as PointLabelStyle);
    } else if (shape.type === ShapeType.POLYLINE) {
      labelCanvas.drawLabelOnPath(labelHTML, shape, {} as OnPathLabelStyle);
    } else {
      labelCanvas.drawLabelInPath(labelHTML, shape, {} as InPathLabelStyle);
    }
  }

  protected drawIconPlus(geocanvas: GeoCanvas, point: Point, iconStyle: IconStyle) {
    if (this.iconVisibilityMode.visibility === IconVisibilityMode.AlwaysVisible) {
      geocanvas.drawIcon(point, {
        ...iconStyle,
        ...getUOMStyle(this.iconVisibilityMode.worldSize),
        ...getIconOccludedStyle(this.iconVisibilityMode.opacity),
      });
    }
    geocanvas.drawIcon(point, { ...iconStyle, ...getUOMStyle(this.iconVisibilityMode.worldSize) });
  }
}
