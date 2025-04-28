import { FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter.js';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas.js';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
import { Shape } from '@luciad/ria/shape/Shape.js';
import { Layer } from '@luciad/ria/view/Layer.js';
import { Map } from '@luciad/ria/view/Map.js';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas.js';
import { ShapeType } from '@luciad/ria/shape/ShapeType.js';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle.js';
import { IconFactory } from '../../controllers/ruler3d/IconFactory';
import { Point } from '@luciad/ria/shape/Point.js';
import { IconStyle } from '@luciad/ria/view/style/IconStyle.js';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
} from '../../../../app/services/performance-settings.service';
import { getIconOccludedStyle, getUOMStyle } from '../iconstyler/IconsStyleProvider';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition.js';
import { BASE_ICON_SIZE } from './generatedicons/MinSizeGeneratedIcons.js';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget.js';
import { Handle } from '@luciad/ria/util/Evented.js';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer.js';
// import { TranslateService } from '@ngx-translate/core';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';

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

const documentHoverSvgs = {
  0: '/assets/icons/document/hover_box/hover_box_file_document.svg',
};

export const LineGeometries = [
  ShapeType.ARC,
  ShapeType.CIRCULAR_ARC,
  ShapeType.CIRCULAR_ARC_BY_3_POINTS,
  ShapeType.CIRCULAR_ARC_BY_BULGE,
  ShapeType.CIRCULAR_ARC_BY_CENTER_POINT,
  ShapeType.POLYLINE,
];

export class DA_DocumentFilePainter extends FeaturePainter {
  protected map: Map | null = null;
  protected iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;
  private mapChangeHandle: Handle | null = null;
  private layer: FeatureLayer;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(map: Map | null = null, /*translateService: TranslateService*/) {
    super();
    this.setMap(map);
  }

  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    this.setMap(map);
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
        this.drawIconPlus(geoCanvas, point, style.pointStyle);
      }
    }
  }

  public setMap(map: Map): void {
    if (map === this.map) return;
    this.resetMap();
    this.map = map;
    this.setListeners();
  }

  private setListeners(): void {
    if (!this.map) return;
    this.mapChangeHandle = this.map.on('MapChange', () => {
      this.onMapChange();
    });
  }

  private resetMap(): void {
    if (!this.mapChangeHandle) return;
    this.mapChangeHandle.remove();
    this.mapChangeHandle = null;
    this.map = null;
  }

  protected onMapChange(): void {
    if (!this.layer) return;
    this.invalidateAll();
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if (!paintState.hovered) return;
    if (paintState.hovered) this.paintLocalLabel(labelCanvas, feature, shape);
  }

  private drawIconPlus(geocanvas: GeoCanvas, point: Point, iconStyle: IconStyle) {
    const baseStyles = {
      ...iconStyle,
      ...getUOMStyle(this.iconVisibilityMode.worldSize),
      // occlusionMode: document.appMapSettings?.itemsOcclusion
      //   ? OcclusionMode.VISIBLE_ONLY
      //   : OcclusionMode.ALWAYS_VISIBLE,
    };

    if (this.iconVisibilityMode.visibility === IconVisibilityMode.AlwaysVisible) {
      geocanvas.drawIcon(point, {
        ...getIconOccludedStyle(this.iconVisibilityMode.opacity),
        ...baseStyles,
      });
    }

    geocanvas.drawIcon(point, baseStyles);
  }

  private paintLocalLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape) {
    const label = feature.properties['name'];
    const labelHTML = `<table class="item-detail-box">
<tr><td><img src="${documentHoverSvgs[0]}" alt="item svg"/></td><td><p class="item-title-label">${label}</p></td></tr>
</table>`;
    if ((shape.type === ShapeType.POLYGON || shape.type === ShapeType.POINT) && shape.focusPoint) {
      labelCanvas.drawLabel(labelHTML, shape.focusPoint, {
        positions: [PointLabelPosition.NORTH],
        offset: 15,
      } as PointLabelStyle);
    }
  }
}
