import {Component, Input} from '@angular/core';
import {Map} from "@luciad/ria/view/Map";
import {Handle} from "@luciad/ria/util/Evented";
import {OutOfBoundsError} from "@luciad/ria/error/OutOfBoundsError";
import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {Point} from "@luciad/ria/shape/Point";
import {LonLatPointFormat} from "@luciad/ria/shape/format/LonLatPointFormat";

export interface Formatter {
  format(point: Point): string;
}

export const CartesianFormatter = {format:(point: Point) => point.toString(true)};

@Component({
  selector: 'app-mouse-coordinates',
  templateUrl: './mouse-coordinates.component.html',
  styleUrls: ['./mouse-coordinates.component.css']
})
export class MouseCoordinatesComponent {
  private _map: Map | null = null;
  private targetReference = getReference("CRS:84");
  private value: Point[] | null[] = [null, null];
  private handles: { mouseMoveHandle: void } | null = null;
  public formattedValue = "";
  public formattedHeight = "";

  @Input()
  public formatter: Formatter = new LonLatPointFormat();

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

  private createListeners() {
    if (this.map) {
      const mouseMoved = (event: MouseEvent): void => {
        if (!this.map) return;
        const tempViewPoint = createPoint(null, []);
        const tempMapPoint = createPoint(this.map.reference, []);
        const tempModelPoint = createPoint(this.targetReference, []);

        const map2Model = createTransformation(this.map.reference, this.targetReference);
        try {
          const mapNodePosition = this.map.domNode.getBoundingClientRect();
          //#snippet transformations
          tempViewPoint.move2D(
            event.clientX - mapNodePosition.left,
            event.clientY - mapNodePosition.top
          );
          this.map.viewToMapTransformation.transform(tempViewPoint, tempMapPoint);
          map2Model.transform(tempMapPoint, tempModelPoint);
          this.value = [tempModelPoint.copy(), tempViewPoint.copy()];
          this.formattedValue = this.useFormattedMouseCoordinate(this.map, this.formatter);
          this.formattedHeight = this.value[0].z.toLocaleString('fullwide', {maximumFractionDigits:1})+"m";
        } catch (e) {
          if (!(e instanceof OutOfBoundsError)) {
            throw e;
          } else {
            this.value = [null, null];
            this.formattedValue = this.useFormattedMouseCoordinate(this.map, this.formatter);
            this.formattedHeight = "";
          }
        }
      };

      const mouseMoveHandle = this.map.domNode.addEventListener("mousemove", mouseMoved, false);

      this.handles = {
        mouseMoveHandle,
      }
    }
  }

  private useFormattedMouseCoordinate = (map: Map, formatter: Formatter): string => {
    const [modelPoint] = this.value;

    if (modelPoint) {
      return formatter.format(modelPoint);
    }
    return "";
  }

}
