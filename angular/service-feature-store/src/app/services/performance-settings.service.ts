import { Injectable } from '@angular/core';
import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { QualityFactorFalloffOptions, TileSet3DLayer } from '@luciad/ria/view/tileset/TileSet3DLayer.js';
import { LayerTreeVisitor } from '@luciad/ria/view/LayerTreeVisitor.js';
import { LayerTreeNode } from '@luciad/ria/view/LayerTreeNode.js';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer.js';
import { LayerGroup } from '@luciad/ria/view/LayerGroup';
import { Layer } from '@luciad/ria/view/Layer';
import { FeaturePainter } from '@luciad/ria/view/feature/FeaturePainter';

const DefaultQualityFactor = 0.25;
const DefaultMaxPointCount = 2000000;

const DefaultMinScale = null;
const DefaultMaxScale = null;

export enum IconVisibilityMode {
  AlwaysVisible = 1,
  Occlude = 0,
}

export interface PainterIconVisibilityMode {
  visibility?: IconVisibilityMode;
  worldSize?: boolean;
  opacity?: boolean;
  damageBoundary?: boolean;
}

export const PainterIconVisibilityModeDefault: PainterIconVisibilityMode = {
  visibility: IconVisibilityMode.AlwaysVisible,
  worldSize: false,
  opacity: false,
  damageBoundary: false,
};

const DefaultQualityFactorFalloff: QualityFactorFalloffOptions = {
  nearDistance: 50,
  farDistance: 200,
  farQualityFactorMultiplier: 0.2,
};

interface FeatureLayerPainter extends FeaturePainter {
  setIconVisibilityMode?: (arg: unknown) => unknown;
  _delegatePainter?: {
    setIconVisibilityMode?: (arg: unknown) => unknown;
  };
}

interface DelegatePainter {
  FeaturePainter?: unknown;
  poiPainter?: {
    setIconVisibilityMode?: (arg: unknown) => unknown;
  };
  annotationPainter?: {
    setIconVisibilityMode?: (arg: unknown) => unknown;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurePerformanceSettingsService {
  private qualityFactor: number = DefaultQualityFactor;
  private maxPointCount: number = DefaultMaxPointCount;
  private minScale: number = DefaultMinScale;
  private maxScale: number = DefaultMaxScale;
  private iconVisibilityMode: PainterIconVisibilityMode = JSON.parse(JSON.stringify(PainterIconVisibilityModeDefault));
  private qualityFactorDistanceFallOff: QualityFactorFalloffOptions = DefaultQualityFactorFalloff;

  public applyIconVisibilityMode(map: WebGLMap, newMode: PainterIconVisibilityMode) {
    this.iconVisibilityMode = { ...this.iconVisibilityMode, ...newMode };
    ConfigurePerformanceSettingsService.setIconVisibilityMode(map, this.iconVisibilityMode);
  }
  public applyQualityFactor(map: WebGLMap, qualityFactor: number) {
    ConfigurePerformanceSettingsService.updateAllMeshLayers(map, qualityFactor);
    this.qualityFactor = qualityFactor;
  }

  public applyQualityFactorDistanceFalloff(map: WebGLMap, qualityFactorDistanceFalloff: QualityFactorFalloffOptions) {
    ConfigurePerformanceSettingsService.updateAllMeshLayersQualityFactorFalloff(map, qualityFactorDistanceFalloff);
    this.qualityFactorDistanceFallOff = qualityFactorDistanceFalloff;
  }

  public applyMaxPointCount(map: WebGLMap, maxPointCount: number) {
    ConfigurePerformanceSettingsService.updateAllPointCloudLayers(map, maxPointCount);
    this.maxPointCount = maxPointCount;
  }

  getQualityFactor() {
    return this.qualityFactor;
  }

  getQualityFactorDistanceFallOff() {
    return this.qualityFactorDistanceFallOff;
  }

  getMaxPointCount() {
    return this.maxPointCount;
  }

  static updateAllMeshLayers(map: WebGLMap, qualityFactor: number) {
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: Layer) => {
          if (layer instanceof TileSet3DLayer) {
            const meshLayer = layer as TileSet3DLayer;
            meshLayer.qualityFactor = qualityFactor;
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: LayerGroup) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
  }

  static updateAllMeshLayersQualityFactorFalloff(
    map: WebGLMap,
    qualityFactorDistanceFalloff: QualityFactorFalloffOptions,
  ) {
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: Layer) => {
          if (layer instanceof TileSet3DLayer) {
            const meshLayer = layer as TileSet3DLayer;
            meshLayer.qualityFactorDistanceFalloff = qualityFactorDistanceFalloff;
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: LayerGroup) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
  }

  static updateAllPointCloudLayers(map: WebGLMap, maxPoints: number) {
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: Layer) => {
          if (layer instanceof TileSet3DLayer) {
            const meshLayer = layer as TileSet3DLayer;
            if (meshLayer.performanceHints) {
              meshLayer.performanceHints = { maxPointCount: maxPoints };
            }
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: LayerGroup) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
  }

  static setIconVisibilityMode(map: WebGLMap, vMode: PainterIconVisibilityMode) {
    if (map && map.layerTree) {
      const layerTreeVisitor = {
        visitLayer: (layer: Layer) => {
          if (layer instanceof FeatureLayer) {
            const featureLayer = layer as FeatureLayer;
            if (featureLayer.painter) {
              if (typeof (featureLayer.painter as FeatureLayerPainter).setIconVisibilityMode === 'function') {
                (featureLayer.painter as FeatureLayerPainter).setIconVisibilityMode(vMode);
                featureLayer.painter.invalidateAll();
              }
              if (typeof (featureLayer.painter as FeatureLayerPainter)._delegatePainter !== 'undefined') {
                if (
                  typeof ((featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter)
                    .FeaturePainter === 'function'
                ) {
                  (featureLayer.painter as FeatureLayerPainter)._delegatePainter.setIconVisibilityMode(vMode);
                }
                if (
                  typeof ((featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter)
                    .poiPainter !== 'undefined'
                ) {
                  if (
                    typeof ((featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter)
                      .poiPainter.setIconVisibilityMode === 'function'
                  )
                    (
                      (featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter
                    ).poiPainter.setIconVisibilityMode(vMode);
                }
                if (
                  typeof ((featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter)
                    .annotationPainter !== 'undefined'
                ) {
                  if (
                    typeof ((featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter)
                      .annotationPainter.setIconVisibilityMode === 'function'
                  )
                    (
                      (featureLayer.painter as FeatureLayerPainter)._delegatePainter as DelegatePainter
                    ).annotationPainter.setIconVisibilityMode(vMode);
                }
                featureLayer.painter.invalidateAll();
              }
            }
          }
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
        visitLayerGroup: (layerGroup: LayerGroup) => {
          layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
          return LayerTreeVisitor.ReturnValue.CONTINUE;
        },
      };
      map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
    }
  }

  getMinScale() {
    return this.minScale;
  }

  getMaxScale() {
    return this.maxScale;
  }

  getIconVisibilityMode() {
    return this.iconVisibilityMode;
  }
}
