import { PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { ShapeType } from '@luciad/ria/shape/ShapeType.js';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { IconFactory } from '../controllers/ruler3d/IconFactory';
import { Point } from '@luciad/ria/shape/Point';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
}  from '../../../app/services/performance-settings.service';
import { getIconOccludedStyle, getUOMStyle } from './iconstyler/IconsStyleProvider';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition.js';
import { Handle } from '@luciad/ria/util/Evented';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { BASE_ICON_SIZE, IconState } from '../interfaces/IconInterfaces';
import {MeasurementPainter} from './MeasurementPainter';


const AStyle = {
  selected: {
    pointStyle: {
      draped: false,
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
      draped: false,
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

export class ExternalDataEntityPainter extends MeasurementPainter {
  protected map: Map | null = null;
  protected iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;
  private mapChangeHandle: Handle | null = null;
  private layer: FeatureLayer;

  constructor(
    map: Map | null = null,
  //  private translateService: TranslateService,
  ) {
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
      if (feature.properties && (feature.properties as { icon: string }).icon) {
        const icon = feature.properties.icon;

        const status = paintState.selected
          ? IconState.SELECTED
          : paintState.hovered
            ? IconState.HOVERED
            : IconState.DEFAULT;
        const url = icon.replace(IconState.DEFAULT, status);
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

  private paintLocalLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape) {
   // const label = this.translateService.instant(feature.properties[feature.properties.mainRecordKey];
    const label = feature.properties[feature.properties.mainRecordKey];

    const icon = feature.properties['icon'];

    const labelHTML = `<table class="item-detail-box">
                          <tr>
                            <td>
                              <img src="${icon}" alt="item svg"/>
                            </td>
                            <td>
                              <p class="item-title-label">${label}</p>
                            </td>
                          </tr>
                        </table>`;
    if (ShapeType.POLYGON && shape.focusPoint) {
      labelCanvas.drawLabel(labelHTML, shape.focusPoint, {
        positions: [PointLabelPosition.NORTH],
        offset: 15,
      } as PointLabelStyle);
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
