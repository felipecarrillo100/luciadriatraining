import {ClusteringPainter} from "./ClusterPainter";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Shape} from "@luciad/ria/shape/Shape";
import {Layer} from "@luciad/ria/view/Layer";
import {FeaturePainter, PaintState} from "@luciad/ria/view/feature/FeaturePainter";
import {Map as RIAMap} from "@luciad/ria/view/Map.js";
import {clusteredFeatures} from "@luciad/ria/view/feature/transformation/ClusteringTransformer";
import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget";
import {IconFactory} from "../controls/ruler3d/IconFactory";
import {LabelCanvas} from "@luciad/ria/view/style/LabelCanvas";
import {PointLabelPosition} from "@luciad/ria/view/style/PointLabelPosition";


const BASE_ICON_SIZE = 25;
const INNER_ICON_SIZE_FACTOR = 0.7;
const InnerCircleType = "InnerCircleType";
const InnerCircleSelectedType = "InnerCircleSelectedType";
const OuterCircleType = "OuterCircleType";
const OuterCircleSelectedType = "OuterCircleSelectedType";
const TextType = "TextType";


interface CustomClusteringPainterStyle {
    scaleIcon?: number;
    stroke?: string;
    fill?: string;
    url?: string;
}
interface CustomClusteringPainterOptions {
    normal: CustomClusteringPainterStyle;
    selected: CustomClusteringPainterStyle;
}

const DefaultStylingOptions: CustomClusteringPainterOptions = {
    normal: {
        scaleIcon: 1.5,
        stroke:  "blue",
        fill: "white",
  //      url: "https://cdn-icons-png.flaticon.com/512/7705/7705037.png"
    },
    selected: {
        scaleIcon: 1.5,
        stroke: "green",
        fill: "white",
//        url: "https://cdn-icons-png.flaticon.com/512/7705/7705037.png"
    }
}

export class CustomClusteringPainter extends ClusteringPainter {
    private options: CustomClusteringPainterOptions;
    private CACHE: Map<string, Map<number, IconStyle>>;

    constructor(delegatePainter: FeaturePainter, options?: CustomClusteringPainterOptions) {
        super(delegatePainter);
        const newOptions = options ? options : DefaultStylingOptions;
        if (options?.selected) {
          newOptions.selected = {...DefaultStylingOptions.selected, ...options.selected}
        }
        if (options?.normal) {
          newOptions.normal = {...DefaultStylingOptions.normal, ...options.normal}
        }
        this.options = newOptions;

        this.CACHE = new Map();
        this.CACHE.set(InnerCircleType, new Map());
        this.CACHE.set(InnerCircleSelectedType, new Map());
        this.CACHE.set(OuterCircleType, new Map());
        this.CACHE.set(OuterCircleSelectedType, new Map());
        this.CACHE.set(TextType, new Map());
    }

    private fromCache(type: string, size: number, producer: (size: number) => IconStyle): IconStyle {
        const cache = this.CACHE.get(type);
        if (cache && !cache.get(size)) {
            cache.set(size, producer(size));
        }
        return cache?.get(size) as IconStyle;
    }

    private createStyleInnerCircle(size: number): IconStyle {
        const scale = this.options.normal.scaleIcon ? this.options.normal.scaleIcon : 1;
        return this.fromCache(InnerCircleType, size, size => ({
            drapeTarget: DrapeTarget.TERRAIN,
            width: `${size * scale}px`,
            height: `${size * scale}px`,

            image: this.options.normal.url ? undefined as any : IconFactory.circle({
                width: size,
                height: size,
                fill: this.options.normal.fill,
                stroke: this.options.normal.fill,
            }),
            url: this.options.normal.url,
            zOrder: 3
        }));
    }

    private createSelectedStyleInnerCircle(size: number): IconStyle {
      const scale = this.options.normal.scaleIcon ? this.options.normal.scaleIcon : 1;

      return this.fromCache(InnerCircleSelectedType, size, size => ({
            drapeTarget: DrapeTarget.TERRAIN,
            width: `${size* scale}px`,
            height: `${size* scale}px`,

            image: this.options.selected.url ? undefined as any : IconFactory.circle({
                width: size,
                height: size,
                fill: this.options.selected.fill,
                stroke: this.options.selected.fill
            }),
            url: this.options.selected.url,
            zOrder: 3
        }));
    }

    private createStyleOuterCircle(size: number): IconStyle {
      const scale = this.options.normal.scaleIcon ? this.options.normal.scaleIcon : 1;

      return this.fromCache(OuterCircleType, size, size => ({
            drapeTarget: DrapeTarget.TERRAIN,
            width: `${size* scale}px`,
            height: `${size* scale}px`,

            image: IconFactory.circle({
                width: size,
                height: size,
                fill: this.options.normal.stroke,
                stroke: this.options.normal.stroke
            }),

            zOrder: 2
        }));
    }

    private createSelectedStyleOuterCircle(size: number): IconStyle {
      const scale = this.options.selected.scaleIcon ? this.options.selected.scaleIcon : 1;

      return this.fromCache(OuterCircleSelectedType, size, size => ({
            drapeTarget: DrapeTarget.TERRAIN,
            width: `${size* scale}px`,
            height: `${size* scale}px`,

            image: IconFactory.circle({
                width: size,
                height: size,
                fill: this.options.selected.stroke,
                stroke: this.options.selected.stroke
            }),
            zOrder: 2
        }));
    }

    private createStyleText(size: number, clusterSize: number): IconStyle {
        const threshold = 20;
        if (clusterSize <= threshold && this.CACHE.get(TextType)?.get(clusterSize)) {
            return this.CACHE.get(TextType)?.get(clusterSize) as IconStyle;
        }

        const icon = {
            drapeTarget: DrapeTarget.TERRAIN,
            width: `${size}px`,
            height: `${size}px`,
            image: IconFactory.text(clusterSize.toString(), {
                width: size,
                height: size,
                fill: "rgba(0, 78, 146, 0.8)",
                font: "9pt Arial"
            }),
            zOrder: 4
        };
        if (clusterSize <= threshold) {
            this.CACHE.get(TextType)?.set(clusterSize, icon);
        }
        return icon;
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

    private getInnerStyle(aClusterFeature: Feature, aSelected: boolean): IconStyle {
        const size = this.getIconSize(clusteredFeatures(aClusterFeature).length, true);
        return aSelected ? this.createSelectedStyleInnerCircle(size) : this.createStyleInnerCircle(size);
    }

    private getOuterStyle(aClusterFeature: Feature, aSelected: boolean): IconStyle {
        const size = this.getIconSize(clusteredFeatures(aClusterFeature).length, false);
        return aSelected ? this.createSelectedStyleOuterCircle(size) : this.createStyleOuterCircle(size);
    }

    private getTextStyle(aClusterFeature: Feature): IconStyle {
        const clusterSize = clusteredFeatures(aClusterFeature).length;
        const size = this.getIconSize(clusterSize, false);
        return this.createStyleText(size, clusterSize);
    }

    override paintClusterBody(geocanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: RIAMap, paintState: PaintState) {
        if ((!paintState.selected && !this.options.normal.url) || (paintState.selected && !this.options.selected.url)){
            geocanvas.drawIcon(shape.focusPoint!, this.getOuterStyle(feature, paintState.selected));
        }
        geocanvas.drawIcon(shape.focusPoint!, this.getInnerStyle(feature, paintState.selected));
       // geocanvas.drawIcon(shape.focusPoint!, getTextStyle(feature));
        if (paintState.selected) {
            // Paint clustered elements when selecting a cluster
            const clusterFeatures = clusteredFeatures(feature);
            for (const clusteredFeature of clusterFeatures) {
                this._delegatePainter.paintBody(geocanvas, clusteredFeature, clusteredFeature.shape!, layer, map, paintState);
            }
        }
    }

  override paintClusterLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: RIAMap, paintState: PaintState): void {
        const label = !paintState.selected ?
            `<div class="CustomClusteringPainter"><span style='color: rgb(44,86,122);'>${feature.properties['clusteredElements'].length}</span></div>` :
            `<div class="CustomClusteringPainter"><span style='color: rgb(131,18,52);'>${feature.properties['clusteredElements'].length}</span></div>`;
        labelCanvas.drawLabel(label, shape.focusPoint!, {
          positions: PointLabelPosition.CENTER,
          priority: 1000
        });
    }
}
