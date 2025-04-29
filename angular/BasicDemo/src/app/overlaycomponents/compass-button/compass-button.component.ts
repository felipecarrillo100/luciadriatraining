import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Map} from "@luciad/ria/view/Map";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {Point} from "@luciad/ria/shape/Point";
import {LonLatPointFormat} from "@luciad/ria/shape/format/LonLatPointFormat";
import {Handle} from "@luciad/ria/util/Evented";
import {Formatter} from "../mouse-coordinates/mouse-coordinates.component";
import {ReferenceType} from "@luciad/ria/reference/ReferenceType.js";
import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera";
import {OutOfBoundsError} from "@luciad/ria/error/OutOfBoundsError";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";
import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {LocationMode} from "@luciad/ria/transformation/LocationMode";
import {createEllipsoidalGeodesy} from "@luciad/ria/geodesy/GeodesyFactory";
import {clamp, RAD2DEG} from "../common/utils/Math";

@Component({
  selector: 'app-compass-button',
  templateUrl: './compass-button.component.html',
  styleUrls: ['./compass-button.component.css']
})
export class CompassButtonComponent {
  private static CRS84 = getReference("CRS:84");
  private static geodesy = createEllipsoidalGeodesy(CompassButtonComponent.CRS84);
  private static OFFSET_DISTANCE = 1000;


  private _map: Map | null = null;
  private handles: { mapChangeHandle: Handle } | null = null;

  @ViewChild('image') indicatorElement: ElementRef | null = null;
  private image: any;

  @Input()
  get map() {
    return this._map;
  }


  set map(value: Map | null) {
    if (this._map) {
      this.releaseListeners();
      this._map = null;
    } else {
      this._map = value;
      this.createListeners();
    }
  }

  private releaseListeners = () => {
    if (this.handles){
      for (const key in this.handles) {
        if (this.handles.hasOwnProperty(key)) {
          // @ts-ignore
          const handle = this.handles[key] as Handle;
          handle?.remove;
        }
      }
      this.handles = null;
    }
  }

  ngAfterViewInit() {
    // A setTimeout is added to force execute at the end of the loop
    setTimeout(() => {
      if (this.indicatorElement) {
        this.image = this.indicatorElement.nativeElement;
      }
    });
  }

  private createListeners() {
    if (this.map) {
      const mapChangeHandle = this.map.on("MapChange", () => {
        if (!this.map) {
          return;
        }
        if (!this.image) {
          return;
        }

        const {x, z} = CompassButtonComponent.calculateCSSRotation(this.map);
        this.image.style.transform = `rotateX(${x}deg) rotateZ(${z}deg)`;
      });
      this.handles = {
        mapChangeHandle
      }
    }
  }

  private static calculateCSSRotation(map: Map) {
    const z = -CompassButtonComponent.getAzimuthAtViewCenter(map);
    let x = 0;

    const camera = map.camera;
    if (camera instanceof PerspectiveCamera) {
      const {pitch: cameraPitch} = camera.asLookFrom();

      // most perpendicular pitch is -89 deg
      x = clamp(89 + cameraPitch, 0, 90);
      // icon rotation is damped to avoid reducing the compass image to a pixel-width line
      x *= 60 / 90;
    }

    return {x, z};
  }

  private static rotateToNorth(map: Map) {
    //try to rotate around the center of the screen or fall back to a rotation on the camera itself.
    let center;
    try {
      center = map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE)
        .transform(createPoint(null, [map.viewSize[0] / 2, map.viewSize[1] / 2]))
    } catch (e) {
      if (!(e instanceof OutOfBoundsError)) {
        throw e;
      }
      center = map.camera.eyePoint;
    }

    const deltaRotation = -CompassButtonComponent.getAzimuthAtViewCenter(map);

    map.mapNavigator.rotate({animate: true, deltaRotation: deltaRotation, deltaYaw: deltaRotation, center});
  }
  private static getAzimuthAtViewCenter(map: Map) {
    //if the map is unreferenced or 3D, we can just get the camera's rotation
    if (map.reference.referenceType === ReferenceType.CARTESIAN || map.reference.referenceType ===
      ReferenceType.GEOCENTRIC) {
      return CompassButtonComponent.getCameraRotation(map);
    }

    //In 2D there might not be a general north direction (eg. polar stereographic projection), we calculate the
    //azimuth by getting the angle between the point at the center of the view and another point north of that.
    try {
      const world2llh = createTransformation(map.reference, CompassButtonComponent.CRS84);
      const llh2world = createTransformation(CompassButtonComponent.CRS84, map.reference);

      const centerViewPoint = createPoint(null, [map.viewSize[0] / 2, map.viewSize[1] / 2]);

      const centerllhPoint = world2llh.transform(map.viewToMapTransformation.transform(centerViewPoint));
      const higherllhPoint = CompassButtonComponent.geodesy.interpolate(centerllhPoint, CompassButtonComponent.OFFSET_DISTANCE, 0);

      const higherViewPoint = map.mapToViewTransformation.transform(llh2world.transform(higherllhPoint));

      return Math.atan2(centerViewPoint.x - higherViewPoint.x, centerViewPoint.y - higherViewPoint.y) * RAD2DEG;
    } catch (e) {
      if (e instanceof OutOfBoundsError) {
        return CompassButtonComponent.getCameraRotation(map);
      } else {
        throw e;
      }
    }
  }

  private static getCameraRotation(map: Map) {
    const camera = map.camera;
    if (camera instanceof PerspectiveCamera) {
      return camera.asLookFrom().yaw;
    } else {
      return camera.asLook2D().rotation;
    }
  }

  rotateToNorth() {
    if (this.map) {
      CompassButtonComponent.rotateToNorth(this.map)
    }
  }
}
