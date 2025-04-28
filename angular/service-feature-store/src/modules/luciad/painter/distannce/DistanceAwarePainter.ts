import { FeaturePainter } from '@luciad/ria/view/feature/FeaturePainter';
import { Map } from '@luciad/ria/view/Map';
import { Handle } from '@luciad/ria/util/Evented';
import { Shape } from '@luciad/ria/shape/Shape';
import { Point } from '@luciad/ria/shape/Point';
import { createSphericalGeodesy } from '@luciad/ria/geodesy/GeodesyFactory';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { CRSEnum } from '@pages/map/enum/CRS.enum';

const referenceCRS84 = getReference(CRSEnum.CRS_84);
const GEODESY = createSphericalGeodesy(referenceCRS84);

export class DistanceAwarePainter extends FeaturePainter {
  protected map: Map | null = null;
  private mapChangeHandle: Handle | null = null;

  protected DEFAULT_DISTANCE = 50;

  constructor(map: Map | null = null) {
    super();
    this.setMap(map);
  }

  public setMap(map: Map) {
    if (map === this.map) return;
    this.resetMap();
    this.map = map;
    this.setListeners();
  }

  protected distanceToCamera(shape: Shape, map: Map) {
    return shape && shape.focusPoint && map.camera && map.camera.eyePoint
      ? DistanceAwarePainter.distance(shape.focusPoint, map.camera.eyePoint)
      : this.DEFAULT_DISTANCE;
  }

  private static distance(point1: Point, point2: Point) {
    return GEODESY.distance3D(point1, point2);
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

  protected onMapChange() {
    this.invalidateAll();
  }

  protected getNormalizedOpacity(distance: number) {
    if (distance > this.DEFAULT_DISTANCE) return 0;
    return 1 - distance / this.DEFAULT_DISTANCE;
  }
}
