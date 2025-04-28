import { PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { PoiPainter } from './PoiPainter';
import { MeasurementPainter } from './MeasurementPainter';
import {
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
} from '../../services/performance-settings.service';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { OnPathLabelStyle } from '@luciad/ria/view/style/OnPathLabelStyle';
import { InPathLabelStyle } from '@luciad/ria/view/style/InPathLabelStyle';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition';
import { Cursor } from '@luciad/ria/model/Cursor';
import { Point } from '@luciad/ria/shape/Point';
import * as GeodesyFactory from '@luciad/ria/geodesy/GeodesyFactory';
import { IconFactory } from '../controllers/ruler3d/IconFactory';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory';
import { createPoint } from '@luciad/ria/shape/ShapeFactory';
import { BASE_ICON_SIZE } from '@pages/map/luciad-map/painters/distannce/generatedicons/MinSizeGeneratedIcons';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget';

const MAX_DISTANCE_TO_STATIONING = 5;

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

export class DamageAnnotationPainter extends PoiPainter {
  private annotationPainter: MeasurementPainter;
  protected iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;

  constructor() {
    super();
    this.annotationPainter = new MeasurementPainter();
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
    const point = shape.focusPoint;
    this.paintBodyIcon(geoCanvas, feature, point, layer, map, paintState);
    if (this.iconVisibilityMode.damageBoundary || (paintState.selected && feature.properties.measurementWrapper)) {
      this.annotationPainter.paintBody(geoCanvas, feature, shape, layer, map, paintState);
    }
  }

  paintBodyIcon(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    const style = this.styleSelection(feature, shape, layer, map, paintState);
    if (shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) {
      const point = shape.focusPoint;
      // Draw icon on focus point
      if (feature.properties && (feature.properties as { damageClass: string }).damageClass) {
        const damageClass = (feature.properties as { damageClass: string }).damageClass;
        const status =
          paintState.selected && paintState.hovered
            ? 'selected_hovered'
            : paintState.selected
              ? 'selected'
              : paintState.hovered
                ? 'hovered'
                : 'default';
        const url = IconMap[status][damageClass];
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
      if (paintState.selected) {
        const { projectedPoint } = this.calculateProjection(point, map);
        if (projectedPoint) {
          this.drawIconPlus(geoCanvas, projectedPoint, projectionPointStyle);
        }
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
    let feature: Feature | null = null;
    let closestStationingDistance = 0;
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

  // project in 2D but return an interpolated 3D point
  private projectPointOnLine(p, p1, p2): Point | null {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;

    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
    if (t < 0 || t > 1) return null;
    return createPoint(p.reference, [p1.x + t * dx, p1.y + t * dy, p1.z + t * dz]);
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if (paintState.hovered) {
      this.paintLocalLabel(labelCanvas, feature, shape, layer, map, paintState);
    } else {
      const rowId = feature.properties.id;
      const element = document.querySelector(`tr[data-rowId="${rowId}"]`);
      if (element) {
        element.classList.remove('hovered-row');
      }
    }
    if (paintState.selected && feature.properties.measurementWrapper) {
      this.annotationPainter.paintLabel(labelCanvas, feature, shape, layer, map, paintState);
    }
    if (paintState.selected) {
      const result = this.calculateProjection(shape.focusPoint, map);
      if (result) {
        const stationingOffset = result.stationing.properties['measurementWrapper'].offset;
        const offset = stationingOffset ? stationingOffset : 0;
        const label = (result.distance + offset).toFixed(2);
        const html = `<span class="icon-damage-projected-stationing">${label}</span>`;
        labelCanvas.drawLabel(html, result.projectedPoint, { positions: PointLabelPosition.NORTH });
      }
    }
  }

  paintLocalLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if (paintState.level !== 1) return;

    const label = feature.properties['number'];
    const labelHTML = `
      <div class="icon-label-container">
        <div class="icon-damage-label outline-map-icon">
          ${label}
        </div>
        <div class="icon-damage-label">
          ${label}
        </div>
      </div>
    `;

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

  public setIconVisibilityMode(iconVisibilityMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = iconVisibilityMode;
  }
}
