import { ClusteringPainter } from './ClusterPainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { Map as RIAMap } from '@luciad/ria/view/Map.js';
import { clusteredFeatures } from '@luciad/ria/view/feature/transformation/ClusteringTransformer.js';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget.js';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition.js';
import { Point } from '@luciad/ria/shape/Point';
import { createPoint } from '@luciad/ria/shape/ShapeFactory.js';
import {
  IconVisibilityMode,
  PainterIconVisibilityMode,
  PainterIconVisibilityModeDefault,
}  from '../../../app/services/performance-settings.service';
import { getIconOccludedStyle } from './iconstyler/IconsStyleProvider';
// import { TranslateService } from '@ngx-translate/core';

const BASE_ICON_SIZE = 25;
const INNER_ICON_SIZE_FACTOR = 0.7;
// const OuterCircleType = 'OuterCircleType';

const DefaultDrapeTarget = DrapeTarget.NOT_DRAPED;
// const DefaultDrapeTarget = undefined;
// const DefaultDrape = undefined;

interface CustomClusteringPainterStyleSeverityClassification {
  value: string | number;
  color: string;
  iconUrl?: string;
}

interface CustomClusteringPainterStyle {
  scaleIcon?: number;
  stroke?: string;
  fill?: string;
  url?: string;
  severity?: {
    property: string;
    classification: CustomClusteringPainterStyleSeverityClassification[];
  };
}

interface CustomClusteringPainterOptions {
  normal: CustomClusteringPainterStyle;
  selected: CustomClusteringPainterStyle;
  hovered?: CustomClusteringPainterStyle;
}

const DefaultStylingOptions: CustomClusteringPainterOptions = {
  normal: {
    scaleIcon: 1.5,
    stroke: 'blue',
    fill: 'white',
  },
  selected: {
    scaleIcon: 1.5,
    stroke: 'green',
    fill: 'white',
  },
  hovered: {
    scaleIcon: 1.5,
    stroke: 'red',
    fill: 'white',
  },
};

export class CustomClusteringPainter extends ClusteringPainter {
  private options: CustomClusteringPainterOptions;
  private iconVisibilityMode: PainterIconVisibilityMode = PainterIconVisibilityModeDefault;

  constructor(
    delegatePainter: FeaturePainter,
 //   translateService: TranslateService,
    options?: CustomClusteringPainterOptions,
  ) {
    super(delegatePainter);
    const newOptions = options ? options : DefaultStylingOptions;
    if (options?.selected) {
      newOptions.selected = { ...DefaultStylingOptions.selected, ...options.selected };
    }
    if (options?.normal) {
      newOptions.normal = { ...DefaultStylingOptions.normal, ...options.normal };
    }
    this.options = newOptions;
  }

  public setIconVisibilityMode(iconVisibilityMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = iconVisibilityMode;
  }

  override getDetailLevelScales(): number[] | null {
    return [1 / 10000];
  }

  private getClassificationColor(clusterFeature: Feature, selected: boolean) {
    const severity = selected ? this.options.selected.severity : this.options.normal.severity;
    if (!severity) return { classification: undefined, color: undefined };
    if (!severity.property && severity.classification.length > 0) {
      const classification = severity.classification[0];
      return { classification: `_${classification.value}`, color: classification.color, url: classification.iconUrl };
    }
    const clusterFeatures = clusteredFeatures(clusterFeature);

    for (const classification of severity.classification) {
      const found = clusterFeatures.find((f) => f.properties[severity.property] === classification.value);
      if (found) {
        return {
          classification: `${severity.property}_${classification.value}`,
          color: classification.color,
          url: classification.iconUrl,
        };
      }
    }
    return { classification: undefined, color: undefined, url: undefined };
  }

  private createStyleOuterCircle(size: number, clusterFeature: Feature): IconStyle {
    const scale = this.options.normal.scaleIcon ? this.options.normal.scaleIcon : 1;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { classification, color, url } = this.getClassificationColor(clusterFeature, false);
    // const cacheKey = classification ? `${OuterCircleType}_${classification}` : OuterCircleType;

    return {
      drapeTarget: DefaultDrapeTarget,
      width: `${size * scale}px`,
      height: `${size * scale}px`,
      url,
      zOrder: 2,
    };
  }

  private getIconSize(aClusterSize: number, inner: boolean): number {
    // Calculate an icon size, based on the cluster size
    let scaleFactor = Math.log(aClusterSize) / Math.log(15);
    scaleFactor = Math.min(Math.max(scaleFactor, 1), 3);
    let size = scaleFactor * BASE_ICON_SIZE;
    if (inner) {
      size *= INNER_ICON_SIZE_FACTOR;
    }
    size = Math.round(size);
    if (size % 2 === 0) {
      size = size + (inner ? 1 : -1);
    }
    return size;
  }

  private getOuterStyle(aClusterFeature: Feature, aSelected: boolean): IconStyle {
    // const size = this.getIconSize(clusteredFeatures(aClusterFeature).length, false);
    const size = 32;
    return aSelected
      ? this.createStyleOuterCircle(size, aClusterFeature)
      : this.createStyleOuterCircle(size, aClusterFeature);
  }

  override paintClusterBody(
    geocanvas: GeoCanvas,
    feature: Feature,
    aShape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ) {
    if (paintState.level !== 1) return;
    const shape = this.correctedClusterHeight(feature, aShape);

    this.drawIconPlus(
      geocanvas,
      shape.focusPoint,
      this.getOuterStyle(feature, paintState.selected || paintState.hovered),
    );

    if (paintState.selected || paintState.hovered) {
      // Paint clustered elements when selecting a cluster
      const clusterFeatures = clusteredFeatures(feature);
      for (const clusteredFeature of clusterFeatures) {
        this._delegatePainter.paintBody(geocanvas, clusteredFeature, clusteredFeature.shape, layer, map, paintState);
      }
    }
  }

  private drawIconPlus(geocanvas: GeoCanvas, point: Point, iconStyle: IconStyle) {
    if (this.iconVisibilityMode.visibility === IconVisibilityMode.AlwaysVisible) {
      geocanvas.drawIcon(point, { ...iconStyle, ...getIconOccludedStyle(this.iconVisibilityMode.opacity) });
    }
    geocanvas.drawIcon(point, { ...iconStyle });
  }

  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ) {
    if (paintState.level !== 1) return;
    super.paintBody(geoCanvas, feature, shape, layer, map, paintState);
  }

  override paintClusterLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    aShape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ): void {
    if (paintState.level !== 1) return;

    const shape = this.correctedClusterHeight(feature, aShape);
    const label = !paintState.selected
      ? `<div class="CustomClusteringPainter"><span>${feature.properties['clusteredElements'].length}</span></div>`
      : `<div class="CustomClusteringPainter selected"><span>${feature.properties['clusteredElements'].length}</span></div>`;
    labelCanvas.drawLabel(label, shape.focusPoint, {
      positions: PointLabelPosition.CENTER,
      priority: 10000,
    });
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ) {
    if (paintState.level !== 1) return;
    super.paintLabel(labelCanvas, feature, shape, layer, map, paintState);
  }

  private correctedClusterHeight(feature: Feature, s: Shape) {
    const clusterFeatures = clusteredFeatures(feature);
    const averageHeight =
      clusterFeatures.reduce((acc: number, feature: Feature) => {
        return acc + feature.shape.focusPoint.z;
      }, 0) / clusterFeatures.length;
    const p = s as Point;
    return createPoint(p.reference, [p.x, p.y, averageHeight === 0 ? 0.001 : averageHeight]);
  }
}
