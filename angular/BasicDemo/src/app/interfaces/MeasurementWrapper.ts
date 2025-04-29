import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle";
import {Polyline} from "@luciad/ria/shape/Polyline";
import {Point} from "@luciad/ria/shape/Point";
import {LookFrom} from "@luciad/ria/view/camera/LookFrom";
import {Measurement} from "../luciad-map/controls/ruler3d/measurement/Measurement";

export interface MeasurementPaintStyles {
  pointStyles: IconStyle[];
  mainLineStyles: ShapeStyle[];
  helperLineStyles: ShapeStyle[];
  areaStyles: ShapeStyle[];
  mainLabelHtmlStyle: string;
  helperLabelHtmlStyle: string;
}

export interface MeasurementSegment {
  line: Polyline;
  distance: number;
  p1: Point;
  p2: Point;
}

export interface MeasurementWrapper<
  S extends MeasurementSegment = MeasurementSegment
> {
  id: string;
  name: string;
  expanded: boolean;
  measurement: Measurement<S>;
  fitPosition: LookFrom;
}
