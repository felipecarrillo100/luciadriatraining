import { OrientedBox } from '@luciad/ria/shape/OrientedBox';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { LuciadMapComponent } from '../../../luciad-map.component';
import { AbstractVisibilityBoxSupport } from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/AbstractVisibilityBoxSupport';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import {
  BOUNDARY_BOX_OUTLINE_COLOR,
  drawBox,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/OrientedBoxDrawUtil';
import {
  OrientedBoxWithAttributes,
  SV_BOX_CHANGE_EVENT,
} from '@pages/map/luciad-map/controllers/boxslicing/orientedbox/SingleVisibilityBoxSupport';

export class MultipleVisibilityBoxSupport extends AbstractVisibilityBoxSupport {
  protected readonly _eventedSupport = new EventedSupport([SV_BOX_CHANGE_EVENT], true);
  private readonly _boxes: Map<string, Feature> = new Map();

  constructor(luciadMap: LuciadMapComponent, boxes: OrientedBoxWithAttributes[]) {
    super(luciadMap);
    for (const box of boxes) {
      const feature = new Feature(box.shape, { name: box.name, color: box.color }, box.id);
      this._boxes.set(box.id, feature);
    }
  }

  public clearBoxes() {
    this._boxes.clear();
  }

  protected getCurrentMap = () => {
    return this.luciadMap.getMap();
  };

  public onDraw(geoCanvas: GeoCanvas) {
    for (const feature of this._boxes.values()) {
      drawBox(geoCanvas, feature.shape as OrientedBox, {
        hightlighted: false,
        withOccludedPart: true,
        color: feature.properties['color'] ?? BOUNDARY_BOX_OUTLINE_COLOR,
      });
    }
  }
}
