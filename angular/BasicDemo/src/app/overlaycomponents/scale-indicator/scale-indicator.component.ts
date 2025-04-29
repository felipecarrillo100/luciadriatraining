import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Handle} from "@luciad/ria/util/Evented";
import {Map} from "@luciad/ria/view/Map";
import {UnitOfMeasure} from "@luciad/ria/uom/UnitOfMeasure";
import {getUnitOfMeasure} from "@luciad/ria/uom/UnitOfMeasureRegistry";
import {getScaleAtMapCenter} from "../common/utils/ScaleUnits";

const MAX_WIDTH_PIXELS = 150;
const INCH_TO_CM = 2.54;
const CM_TO_METER = 100;
const DPI = 96; //canvas DPI is guaranteed to be 96.

export enum ScaleType {
  /**
   * A map scale ratio at the origin of the projection.
   * The accuracy of this map scale depends on the distance (in meters) between the origin of the projection,
   * and what is currently visible on screen. Typically, the larger the distance, the greater the
   * distortion will be that is caused by the projection, and the less accurate
   * the scale is.
   * <p/>
   * If, for example, the projection is centered on Paris, the scale is calculated
   * for Paris. Therefore, if the view is showing the US, the scale calculated
   * by this method is potentially way off compared to what is visible on
   * screen.
   */
  PROJECTION_CENTER = "ProjectionCenter",

  /**
   * A map scale ratio at the center of the current map extents.
   * If the projection is centered on a spot far away of the current map extents, the scale
   * calculated by this method is still accurate (it is measured horizontally).
   * This does imply however that the map scale changes by simply
   * panning the map around.
   */
  MAP_CENTER = "MapCenter"
}

const METER = getUnitOfMeasure("Meter");
const CM = getUnitOfMeasure("Centimeter");
const KM = getUnitOfMeasure("Kilometer");
const MILE = getUnitOfMeasure("Mile");
const FT = getUnitOfMeasure("Foot");

const findBestDistanceUOM = (aCurrentDistanceUnit: UnitOfMeasure, aLengthInMeter: number): UnitOfMeasure => {
  const aLengthInDistanceUnit = aCurrentDistanceUnit.convertFromStandard(aLengthInMeter);
  if (aCurrentDistanceUnit === METER && aLengthInDistanceUnit > 1000) {
    return KM;
  }
  if (aCurrentDistanceUnit === METER && aLengthInDistanceUnit < 1) {
    return CM;
  }
  if (aCurrentDistanceUnit === KM && aLengthInDistanceUnit < 1) {
    return METER;
  }
  if (aCurrentDistanceUnit === FT && MILE.convertFromStandard(aLengthInMeter) > 1) {
    return MILE;
  }
  if (aCurrentDistanceUnit === MILE && aLengthInDistanceUnit < 1) {
    return FT;
  }
  return aCurrentDistanceUnit;
}

const findLower125 = (aNumber: number) => {
  const lowestValue = Math.pow(10, Math.floor(Math.log(aNumber) / Math.log(10)));
  if (aNumber > 5 * lowestValue) {
    return 5 * lowestValue;
  }
  if (aNumber > 2 * lowestValue) {
    return 2 * lowestValue;
  }
  return lowestValue;
}

@Component({
  selector: 'app-scale-indicator',
  templateUrl: './scale-indicator.component.html',
  styleUrls: ['./scale-indicator.component.css']
})
export class ScaleIndicatorComponent {
  private _map: Map | null = null;
  private handles: { mapChangeListener: Handle } | null =  null;
  private scale: any;
  public style = "";
  public text = "";

  @ViewChild('indicator') indicatorElement: ElementRef | null = null;

  @Input()
  public uom: UnitOfMeasure = getUnitOfMeasure("Kilometer");
  private scaleType: ScaleType = ScaleType.MAP_CENTER;
  private maxWidth: number = MAX_WIDTH_PIXELS;

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
    if (!this.map) return;
    const mapChangeListener = this.map.on("MapChange", () => {
      if (!this.map) return;
      const mapScale = this.scaleType === ScaleType.PROJECTION_CENTER ? this.map.mapScale[0] : getScaleAtMapCenter(this.map);
      if (mapScale !== this.scale) {
        this.scale = mapScale;
        const {width, left, text} = this.calculateScaleIndicator(this.scale);
        this.style = `width:${width}px; left:${left}px`;
        this.text = text;
      }
    });
    this.handles = {
      mapChangeListener
    }
  }

  ngAfterViewInit() {
    // A setTimeout is added to force execute at the end of the loop
    setTimeout(() => {
       this.maxWidth = this.indicatorElement ? this.indicatorElement.nativeElement.getBoundingClientRect().width : MAX_WIDTH_PIXELS;
    });
  }

  private calculateScaleIndicator = (mapScale: number) => {
    const pixelScale = mapScale * (DPI / INCH_TO_CM) * CM_TO_METER
    const barWidthInMeter = this.maxWidth / pixelScale;
    const localDistanceUnit = findBestDistanceUOM(this.uom ?? METER, barWidthInMeter);
    const barWidthInDistanceUnit = findLower125(localDistanceUnit.convertFromStandard(barWidthInMeter));
    const barWidthInPixels = pixelScale * localDistanceUnit.convertToStandard(barWidthInDistanceUnit);
    return {
      width: barWidthInPixels,
      left: (this.maxWidth - barWidthInPixels) / 2,
      text: barWidthInDistanceUnit + ' ' + localDistanceUnit.symbol
    };
  }

}
