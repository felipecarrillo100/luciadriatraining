import { PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
} from '../../../../app/services/performance-settings.service';
import { ShapeType } from '@luciad/ria/shape/ShapeType.js';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { OnPathLabelStyle } from '@luciad/ria/view/style/OnPathLabelStyle';
import { InPathLabelStyle } from '@luciad/ria/view/style/InPathLabelStyle';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition.js';
import { Cursor } from '@luciad/ria/model/Cursor';
import { Point } from '@luciad/ria/shape/Point';
import * as GeodesyFactory from '@luciad/ria/geodesy/GeodesyFactory.js';
import { IconFactory } from '../../controllers/ruler3d/IconFactory';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory.js';
import { createPoint } from '@luciad/ria/shape/ShapeFactory.js';
import { BASE_ICON_SIZE } from './generatedicons/MinSizeGeneratedIcons';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { getIconOccludedStyle, getUOMStyle } from '../iconstyler/IconsStyleProvider';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';
import { Handle } from '@luciad/ria/util/Evented';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget.js';
import { DamageMeasurementPainter } from '../DamageMeasurementPainter';
import {MeasurementWrapper} from '../../interfaces/MeasurementWrapper';
// import { TranslateService } from '@ngx-translate/core';
// import { MeasurementUnitsService } from '@shared/services/measurement-units-converter.service';

const MAX_DISTANCE_TO_STATIONING = 5;

// ! This modes not compatible with luciad painters somehow
// These values are not available during some drawings (like during location editing).
enum MODE_ON_SIZE {
  POINT = 0,
  POLYGON = 1,
}

class FeatureWithShapeMode extends Feature {
  mode: MODE_ON_SIZE;
}

const projectionPointStyle = {
  drapeTarget: DrapeTarget.NOT_DRAPED,
  image: IconFactory.circle({
    fill: 'rgb(0,72,255)',
    stroke: 'rgb(43,141,194)',
    width: 12,
    height: 12,
  }),
  width: '12px',
  height: '12px',
};

const IconMap = {
  default: {
    0: '/assets/icons/damage/general/default/damage_general_level_00.png',
    1: '/assets/icons/damage/general/default/damage_general_level_01.png',
    2: '/assets/icons/damage/general/default/damage_general_level_02.png',
    3: '/assets/icons/damage/general/default/damage_general_level_03.png',
    4: '/assets/icons/damage/general/default/damage_general_level_04.png',
  },
  hovered: {
    0: '/assets/icons/damage/general/hovered/damage_general_level_00.png',
    1: '/assets/icons/damage/general/hovered/damage_general_level_01.png',
    2: '/assets/icons/damage/general/hovered/damage_general_level_02.png',
    3: '/assets/icons/damage/general/hovered/damage_general_level_03.png',
    4: '/assets/icons/damage/general/hovered/damage_general_level_04.png',
  },
  selected: {
    0: '/assets/icons/damage/general/selected/damage_general_level_00.png',
    1: '/assets/icons/damage/general/selected/damage_general_level_01.png',
    2: '/assets/icons/damage/general/selected/damage_general_level_02.png',
    3: '/assets/icons/damage/general/selected/damage_general_level_03.png',
    4: '/assets/icons/damage/general/selected/damage_general_level_04.png',
  },
  selected_hovered: {
    0: '/assets/icons/damage/general/selected_hovered/damage_general_level_00.png',
    1: '/assets/icons/damage/general/selected_hovered/damage_general_level_01.png',
    2: '/assets/icons/damage/general/selected_hovered/damage_general_level_02.png',
    3: '/assets/icons/damage/general/selected_hovered/damage_general_level_03.png',
    4: '/assets/icons/damage/general/selected_hovered/damage_general_level_04.png',
  },
};

const damageHoverSvgs = {
  0: '/assets/icons/damage/hover_box/hover_box_damage_level_00.svg',
  1: '/assets/icons/damage/hover_box/hover_box_damage_level_01.svg',
  2: '/assets/icons/damage/hover_box/hover_box_damage_level_02.svg',
  3: '/assets/icons/damage/hover_box/hover_box_damage_level_03.svg',
  4: '/assets/icons/damage/hover_box/hover_box_damage_level_04.svg',
};

export class DA_DamageAnnotationPainter extends DamageMeasurementPainter {
  protected map: Map | null = null;
  private mapChangeHandle: Handle | null = null;

  protected iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;
  private layer: FeatureLayer;

  constructor(
    map: Map | null = null,
    // private translateService: TranslateService,
    // private measurementUnitsService: MeasurementUnitsService,
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
    this.layer = layer as FeatureLayer;
    this.setMap(map);

    const point = shape.focusPoint;

    if (feature.properties.measurementWrapper) {
      this.paintDamageProjectionOnStationing(geoCanvas, feature, point, layer, map, paintState);
      this.paintMinSizeIcon(geoCanvas, feature, point, layer, map, paintState);

      if ((feature as FeatureWithShapeMode).mode !== MODE_ON_SIZE.POINT) {
        super.paintBody(geoCanvas, feature, shape, layer, map, paintState);
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
    if (paintState.hovered) this.paintLocalLabel(labelCanvas, feature, shape);
  }

  public getDetailLevelScales() {
    return null;
  }

  public setIconVisibilityMode(iconVisibilityMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = iconVisibilityMode;
  }

  public setMap(map: Map) {
    if (map === this.map) return;
    this.resetMap();
    this.map = map;
    this.setListeners();
  }

  protected drawIconAlways(geocanvas: GeoCanvas, point: Point, iconStyle: IconStyle) {
    geocanvas.drawIcon(point, {
      ...iconStyle,
      // occlusionMode: document.appMapSettings?.itemsOcclusion
      //   ? OcclusionMode.VISIBLE_ONLY
      //   : OcclusionMode.ALWAYS_VISIBLE,
    });
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

  protected onMapChange() {
    if (this.layer) {
      const features = this.layer.workingSet.get();
      for (const feature of features) {
        const mode = this.detectModeOnSize(feature, this.map);
        if ((feature as FeatureWithShapeMode).mode !== mode) {
          (feature as FeatureWithShapeMode).mode = mode;
          this.invalidateById(feature.id);
        }
      }
    }
  }

  protected detectModeOnSize(feature: Feature, map: Map) {
    try {
      const wrapper = feature.properties['measurementWrapper'] as MeasurementWrapper;
      const bounds = wrapper.measurement.bounds;
      const worldBounds = createTransformation(bounds.reference, map.reference).transformBounds(bounds);
      const pixels = map.mapToViewTransformation.transformBounds(worldBounds);
      if (pixels.width < BASE_ICON_SIZE && pixels.height < BASE_ICON_SIZE) {
        return MODE_ON_SIZE.POINT;
      } else {
        return MODE_ON_SIZE.POLYGON;
      }
    } catch {
      return MODE_ON_SIZE.POLYGON;
    }
  }

  // project in 2D but return an interpolated 3D point
  private projectPointOnLine(p, p1, p2): Point | null {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;

    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
    if (t < 0 || t > 1) return null;
    return createPoint(p.reference, [p1.x + t * dx, p1.y + t * dy, p1.z + t * dz]);
  }

  private paintDamageProjectionOnStationing(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if ((shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) && paintState.selected) {
      const result = this.calculateProjection(shape.focusPoint, map);

      if (result?.projectedPoint) {
        this.drawIconPlus(geoCanvas, result.projectedPoint, projectionPointStyle);
      }
    }
  }

  private calculateProjection(
    point: Point,
    map: Map,
  ): { projectedPoint: Point; distance: number; stationing: Feature | null } | undefined {
    const layer = map.layerTree.findLayerById('stationing') as FeatureLayer;
    if (!layer) {
      return undefined;
    }

    let closestPoint: Point | undefined = undefined;
    let closestDistance = Number.MAX_VALUE;
    let closestStationingDistance = 0;
    let feature: Feature | null = null;
    const stationingIterator = layer.model.query() as Cursor<Feature>;
    while (stationingIterator.hasNext()) {
      const stationing = stationingIterator.next();
      const segments = stationing.properties.measurementWrapper.measurement.segments;
      const geodesy = GeodesyFactory.createSphericalGeodesy(stationing.shape.reference);
      const refPoint = stationing.shape.reference.equals(point.reference)
        ? point
        : createTransformation(point.reference, stationing.shape.reference).transform(point);

      let stationingDistance = 0;
      for (const segment of segments) {
        const projectedPoint = this.projectPointOnLine(refPoint, segment.p1, segment.p2);
        if (projectedPoint !== null) {
          const distance = geodesy.distance(refPoint, projectedPoint);
          if (distance < MAX_DISTANCE_TO_STATIONING && distance < closestDistance) {
            feature = stationing;
            closestPoint = projectedPoint;
            closestDistance = distance;
            closestStationingDistance = stationingDistance + geodesy.distance(segment.p1, projectedPoint);
          }
        }
        stationingDistance += segment.distance;
      }
    }

    return { projectedPoint: closestPoint, distance: closestStationingDistance, stationing: feature };
  }

  private paintLocalLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape) {
    const { type, detail } = feature.properties;
   //  const label = this.translateService.instant(type['name']);
    const label = type['name'];
    const damageClass = feature.properties.damageClass;
    const showSizes = ['size1', 'size2', 'size3'];
    const useUnits = ['measurement_unit_1', 'measurement_unit_2', 'measurement_unit_3'];
    const sizes = Object.keys(detail)
      .filter((key) => detail[key] !== null && key.includes('size'))
      .filter((key) => showSizes.includes(key))
      .map((key, index) => this.convertSize(detail[key], type[useUnits[index]]))
      .join('&nbsp;&centerdot;&nbsp;');

    const labelHTML = `
      <table class="item-detail-box">
        <tr>
          <td>
            <img src="${damageHoverSvgs[damageClass]}" alt="item svg"/>
          </td>
          <td>
            <p class="item-title-label">${label}</p>
          </td>
        </tr>
        <tr>
          <td>
            <p class="damage-grid-reference-id">${detail.size1 ? 'GR.' : ''}</p>
          </td>
          <td>
            <div class="damage-size">${sizes}<div>
          </td>
        </tr>
      </table>`;

    if ((shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) && shape.focusPoint) {
      labelCanvas.drawLabel(labelHTML, shape.focusPoint, {
        positions: [PointLabelPosition.NORTH],
        offset: 10,
      } as PointLabelStyle);
    } else if (shape.type === ShapeType.POLYLINE) {
      labelCanvas.drawLabelOnPath(labelHTML, shape, {} as OnPathLabelStyle);
    } else {
      labelCanvas.drawLabelInPath(labelHTML, shape, {} as InPathLabelStyle);
    }
  }

  private convertSize(size: number | null, unit: string | null): string {
    // if (!size || !unit) return '';
    //
    // const convertedSize = this.measurementUnitsService.convertFromMM(
    //   size,
    //   this.measurementUnitsService.measurementUnitsListById[unit],
    // );
    //
    // return convertedSize + ' ' + this.measurementUnitsService.measurementUnitsListById[unit];
    return `${size}`;
  }

  private setListeners() {
    if (!this.map) return;
    this.mapChangeHandle = this.map.on('MapChange', () => {
      this.onMapChange();
    });
  }

  private resetMap() {
    if (this.mapChangeHandle) {
      this.mapChangeHandle.remove();
      this.mapChangeHandle = null;
      this.map = null;
    }
  }

  private paintMinSizeIcon(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    const damageClass = (feature.properties as { damageClass: string }).damageClass;
    const status =
      paintState.selected && paintState.hovered
        ? 'selected_hovered'
        : paintState.selected
          ? 'selected'
          : paintState.hovered
            ? 'hovered'
            : 'default';

    this.drawIconAlways(geoCanvas, shape.focusPoint, {
      width: `${BASE_ICON_SIZE}px`,
      height: `${BASE_ICON_SIZE}px`,
      image: undefined,
      url: IconMap[status][damageClass],
    });
  }
}
