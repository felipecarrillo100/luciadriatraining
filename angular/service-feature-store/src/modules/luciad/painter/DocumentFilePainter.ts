import { FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { OnPathLabelStyle } from '@luciad/ria/view/style/OnPathLabelStyle';
import { InPathLabelStyle } from '@luciad/ria/view/style/InPathLabelStyle';
import { IconFactory } from '../controllers/ruler3d/IconFactory';
import { Point } from '@luciad/ria/shape/Point';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
} from '../../services/performance-settings.service';
import { getIconOccludedStyle, getUOMStyle } from './iconstyler/IconsStyleProvider';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition';
import { BASE_ICON_SIZE } from '@pages/map/luciad-map/painters/distannce/generatedicons/MinSizeGeneratedIcons';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget';

const AStyle = {
  selected: {
    pointStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      image: IconFactory.circle({
        fill: 'rgba(255,0,0,1)',
        stroke: 'rgba(255,255,255,1)',
        width: 15,
        height: 15,
      }),
      width: '58px',
      height: '58px',
      anchorY: '80%',
    },
  },
  default: {
    pointStyle: {
      drapeTarget: DrapeTarget.NOT_DRAPED,
      image: IconFactory.circle({
        fill: 'rgba(255,0,0,1)',
        stroke: 'rgba(255,255,255,1)',
        width: 10,
        height: 10,
      }),
      width: '56px',
      height: '56px',
      anchorY: '80%',
    },
  },
};

const IconMap = {
  default: {
    'file_general.png': '/assets/icons/document/general/default/file_general.png',
  },
  hovered: {
    'file_general.png': '/assets/icons/document/general/hovered/file_general.png',
  },
  selected: {
    'file_general.png': '/assets/icons/document/general/selected/file_general.png',
  },
  selected_hovered: {
    'file_general.png': '/assets/icons/document/general/selected_hovered/file_general.png',
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

export class DocumentFilePainter extends FeaturePainter {
  private iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;

  constructor() {
    super();
  }

  public setIconVisibilityMode(iconVisibilityMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = iconVisibilityMode;
  }

  getDetailLevelScales(): number[] | null {
    return [1 / 1000];
  }
  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    const style = paintState.selected ? AStyle.selected : AStyle.default;
    if (shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) {
      const point = shape.focusPoint;
      // Draw icon on focus point
      if (feature.properties && (feature.properties as { iconName: string }).iconName) {
        const iconName = (feature.properties as { iconName: string }).iconName;
        const status =
          paintState.selected && paintState.hovered
            ? 'selected_hovered'
            : paintState.selected
              ? 'selected'
              : paintState.hovered
                ? 'hovered'
                : 'default';
        const url = IconMap[status][iconName];
        this.drawIconPlus(geoCanvas, point, {
          ...style.pointStyle,
          image: undefined,
          url,
          width: `${BASE_ICON_SIZE}px`,
          height: `${BASE_ICON_SIZE}px`,
        });
      } else {
        const pointStyle = { ...style.pointStyle };
        this.drawIconPlus(geoCanvas, point, pointStyle);
      }
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
    if (!paintState.hovered) {
      const rowId = feature.properties.id;
      const element = document.querySelector(`tr[data-rowId="${rowId}"]`);
      if (element) element.classList.remove('hovered-row');
      return;
    }

    const label = feature.properties['name'];
    const labelHTML = `<div class="icon-label-container"><div class="icon-document-label outline-map-icon"> ${label}</div><div class="icon-document-label">${label}</div></div>`;

    if ((shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) && shape.focusPoint) {
      const rowId = feature.properties.id;
      const element = document.querySelector(`tr[data-rowId="${rowId}"]`);
      if (element) {
        element.classList.add('hovered-row');
      }
      labelCanvas.drawLabel(labelHTML, shape.focusPoint, { positions: [PointLabelPosition.SOUTH] } as PointLabelStyle);
    } else if (shape.type === ShapeType.POLYLINE) {
      labelCanvas.drawLabelOnPath(labelHTML, shape, {} as OnPathLabelStyle);
    } else {
      labelCanvas.drawLabelInPath(labelHTML, shape, {} as InPathLabelStyle);
    }
  }

  private drawIconPlus(geocanvas: GeoCanvas, point: Point, iconStyle: IconStyle) {
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
