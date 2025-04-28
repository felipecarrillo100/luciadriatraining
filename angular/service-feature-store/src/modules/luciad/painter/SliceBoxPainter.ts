import { FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { drawBox } from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxDrawUtil';
import { OrientedBox } from '@luciad/ria/shape/OrientedBox';

export class SliceBoxPainter extends FeaturePainter {
  public static focusedConfigId: string | number;
  paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
    if (!SliceBoxPainter.focusedConfigId || feature.id === SliceBoxPainter.focusedConfigId) {
      drawBox(geoCanvas, shape as OrientedBox, {
        hightlighted: !SliceBoxPainter.focusedConfigId && paintState.hovered,
        withOccludedPart: true,
      });
    }
  }
}
