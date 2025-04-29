import * as GeodesyFactory from "@luciad/ria/geodesy/GeodesyFactory";
import * as ReferenceProvider from "@luciad/ria/reference/ReferenceProvider";
import { Controller } from "@luciad/ria/view/controller/Controller";
import {EVENT_IGNORED, HandleEventResult} from "@luciad/ria/view/controller/HandleEventResult";
import { GestureEventType } from "@luciad/ria/view/input/GestureEventType";
import { Map } from "@luciad/ria/view/Map";
import { GeoCanvas } from "@luciad/ria/view/style/GeoCanvas";
import { LabelCanvas } from "@luciad/ria/view/style/LabelCanvas";
import { GestureEvent } from "@luciad/ria/view/input/GestureEvent";
import {LocationMode} from "@luciad/ria/transformation/LocationMode";

// import { LocationMode } from "@luciad/ria/transformation/LocationMode";
// const LocationMode = LocationModeSt as any;

import * as TransformationFactory from "@luciad/ria/transformation/TransformationFactory";

import FormatUtil from "./FormatUtil";
import Measurement from "./Measurement";
import Ruler3DPresentation from "./Ruler3DPresentation";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";

const SQUARED_SLACK = 100; //some slack when clicking.

export interface Ruler3DUpdateValues {
    area: number;
    distance: number;
    areaText: string;
    distanceText: string;
}

export enum Ruler3DControllerTypes {
    MEASURE_TYPE_AREA = "area",
    MEASURE_TYPE_DISTANCE = "distance",
    MEASURE_TYPE_ORTHO = "orthogonal",
    MEASURE_TYPE_HEIGHT = "height",
}
enum MEASURE_TYPE {
    MEASURE_TYPE_PARAM = "measureType",
}

interface Ruler3DControllerOptions {
    enabled?: boolean;
    measureType?: any;
}

/**
 * Creates the Ruler Controller instance.
 * @constructor
 */
class Ruler3DController extends Controller {
    // RESULTS PRESENTATION
    public static MEASUREMENT_CHANGED = "MEASUREMENT_CHANGED";
    public static MEASUREMENT_DEACTIVATED = "MEASUREMENT_DEACTIVATED";
    public static ENABLED_CHANGE_EVENT = "ENABLED_CHANGED";
   // public static MEASURE_TYPE_PARAM = "measureType";

 //   private _measureResult: null;
    private _measureOptions: {};
    private _wait: boolean;
    private _dx: number | null | undefined;
    private _dy: number | null | undefined;
    private _suspended: boolean;
    // @ts-ignore
    private _measurement: Measurement;
    // @ts-ignore
    private _presentation: Ruler3DPresentation;
    private _eventSupport: EventedSupport;
    private _enabled: boolean;

    constructor(optionsIn?: Ruler3DControllerOptions) {
        super();
      // private properties
 //     this._measureResult = null;
      this._measureOptions = {};

      this._wait = false;
      this._dx = null;
      this._dy = null;
      this._eventSupport = new EventedSupport([Ruler3DController.MEASUREMENT_CHANGED, Ruler3DController.MEASUREMENT_DEACTIVATED, Ruler3DController.ENABLED_CHANGE_EVENT], true);

      const options: Ruler3DControllerOptions =  optionsIn ? optionsIn : {enabled: true};
      this._enabled = typeof options.enabled !== "undefined" ? options.enabled : true;
      this.setMeasureOptions(MEASURE_TYPE.MEASURE_TYPE_PARAM, options[MEASURE_TYPE.MEASURE_TYPE_PARAM] || Ruler3DControllerTypes.MEASURE_TYPE_DISTANCE);
      this._suspended = false;
  }

    public get formatUtil(): FormatUtil {
        return this._presentation.formatUtil;
    }

    public set formatUtil(value: FormatUtil) {
        this._presentation.formatUtil = value;
        this.invalidate();
    }

    get segments(): any[] {
        return this._measurement.segments;
    }

    get totals(): any[] {
        return this._presentation.getTotals(this._measurement.segments);
    }

    public getMeasurements = function () {
        // @ts-ignore
        const segments = this._measurement.segments;
        return {
            segments,
            // @ts-ignore
            totals: this._presentation.getTotals(segments)
        };
    };

    /**
     * Called when the controller becomes active. Perform any setup here.
     */
    override onActivate (map: Map) {
        this.init(map);
        super.onActivate(map)
    }

    /**
     * called when the controller becomes inactive
     * perform any cleanup here.
     */
    override onDeactivate(map: Map) {
        this._measurement.reset();
        super.onDeactivate(map);
        // this.emit(Ruler3DController.MEASUREMENT_DEACTIVATED, undefined);
        // Controller implements Evented - inform listeners that measure results changed
        this._eventSupport.emit(Ruler3DController.MEASUREMENT_DEACTIVATED);
    }

    onMeasurementChange = (callback: any) => {
        this._eventSupport.on(Ruler3DController.MEASUREMENT_CHANGED, callback);
    };

    onMeasurementDeactivated = (callback: any) => {
        this._eventSupport.on(Ruler3DController.MEASUREMENT_DEACTIVATED, callback);
    };

    onControllerEnabledDisabled = (callback: any) => {
        this._eventSupport.on(Ruler3DController.ENABLED_CHANGE_EVENT, callback);
    };

    /**
     * Handle the user input gestures. The event-object contains information about the type of user-interaction
     */
    override onGestureEvent (event: GestureEvent):HandleEventResult {
        if (!this._enabled) {
            return EVENT_IGNORED;
        }
        switch (event.type) {
            case GestureEventType.DRAG:
                return this.onDrag(event) as any;
            case GestureEventType.DRAG_END:
                return this.onDragEnd(event) as any;
            case GestureEventType.DOWN:
                return this.onDown(event);
            case GestureEventType.SINGLE_CLICK_UP:
                return this.onClick(event);
            case GestureEventType.MOVE:
                //when user "hovers" over the map, we measure, but do not confirm any point
                return this.onMove(event) as any;
            case GestureEventType.DOUBLE_CLICK:
                //user confirms the polyline
                return this.onDoubleClick();
            case GestureEventType.SINGLE_CLICK_CONFIRMED:
                //user performed click and no double click can follow
                return this.onClickConfirmed(event);
            default:
                break;
        }
        return EVENT_IGNORED;
    }

    public setMeasureOptions  (parameter: string, state: Ruler3DControllerTypes) {
        // @ts-ignore
        this._measureOptions[parameter] = state;
        this.invalidate();
    }

    public isCurrentMeasureType (measureType: Ruler3DControllerTypes) {
        // @ts-ignore
        return this._measureOptions[Ruler3DController.MEASURE_TYPE_PARAM] === measureType;
    }

    public getMode() {
        // @ts-ignore
        const mode = this._measureOptions[Ruler3DController.MEASURE_TYPE_PARAM];
        return mode;
    }

    public setMode(name: string) {
        // @ts-ignore
        this.setMeasureOptions(Ruler3DController.MEASURE_TYPE_PARAM, name);
        // this.setMeasureOptions(Ruler3DController.MEASURE_TYPE_PARAM, CONST_MODE_3D[name]);
    }

    /**
     * This method is invoked whenever the controller is invalidated.
     */
    override onDraw (geoCanvas: GeoCanvas) {
        // Array of {line, distance, p1, p2} where p1, p2 {modelPoint, worldPoint}
        const segments = this._measurement.segments;

        const isTypeOrtho = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_ORTHO);
        const isTypeHeight = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_HEIGHT);
        const isTypeArea = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_AREA);


        if (isTypeArea) {
            this._presentation.drawArea(geoCanvas, segments);
        }

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            this._presentation.drawSegmentPoints(geoCanvas, segment, i);

            if (!isTypeHeight) {
                this._presentation.drawSegment(geoCanvas, segment);
            }

            if (isTypeOrtho) {
                this._presentation.drawOrtho(geoCanvas, segment);
            }

            if (isTypeHeight) {
                this._presentation.drawHeight(geoCanvas, segment, i);
            }
        }
        // Controller implements Evented - inform listeners that measure results changed
        // this.emit(Ruler3DController.MEASUREMENT_CHANGED, undefined);
        this._eventSupport.emit(Ruler3DController.MEASUREMENT_CHANGED);
    }

    override onDrawLabel (labelCanvas: LabelCanvas) {
        // Array of {line, distance, p1, p2} where p1, p2 {modelPoint, worldPoint}
        const segments = this._measurement.segments;

        const isTypeOrtho = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_ORTHO);
        const isTypeHeight = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_HEIGHT);
        const isTypeArea = this.isCurrentMeasureType(Ruler3DControllerTypes.MEASURE_TYPE_AREA);


        if (isTypeArea) {
            this._presentation.drawAreaLabel(labelCanvas, segments);
        }

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (!isTypeHeight) {
                this._presentation.drawSegmentLabel(labelCanvas, segment);
            }

            if (isTypeOrtho) {
                this._presentation.drawOrthoLabel(labelCanvas, segment);
            }

            if (isTypeHeight) {
                this._presentation.drawHeightLabel(labelCanvas, segment, i);
            }
        }
    }


    private letGo = function () {
        // @ts-ignore
        this._wait = false;
        // @ts-ignore
        this._dx = undefined;
        // @ts-ignore
        this._dy = undefined;
    };

    private withinSlack  (event: GestureEvent) {
        if (!this._wait) {
            return false;
        }

        const x = event.viewPosition[0];
        const y = event.viewPosition[1];
        // @ts-ignore
        const dist = squaredDistance(this._dx, this._dy, x, y);
        return (dist < SQUARED_SLACK);

        function squaredDistance(x1: number, y1: number, x2: number, y2: number) {
            return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        }
    }

    // @ts-ignore
  override onDrag  (event: GestureEvent) {

        if (this._wait) {
            if (this.withinSlack(event)) {
                return HandleEventResult.EVENT_HANDLED;
            }
        } else {
            this.letGo();
        }
    }

    // @ts-ignore
  private onDragEnd (event: GestureEvent) {

        if (this.withinSlack(event)) {
            return this.onClick(event);
        }

        this.letGo();
    }

    private onMove  (event: GestureEvent) {
        if (!this._measurement.isStarted()) {
            return;
        }
        this.letGo();

        this._measurement.updateLastPosition(event.viewPosition);
        this.invalidate();
        return HandleEventResult.EVENT_HANDLED;
    }

    private onClickConfirmed (event: GestureEvent) {
        this._measurement.startMeasures(event.viewPosition);
        this.invalidate();
        return HandleEventResult.EVENT_HANDLED;
    }

    private onDown (event: GestureEvent) {
        //by holding on to the down coordinates, we can introduce a little slack
        const loc = event.viewPosition;
        this._dx = loc[0];
        this._dy = loc[1];
        this._wait = true;
        return HandleEventResult.EVENT_HANDLED;
    }

    private onClick  (event: GestureEvent) {
        this._measurement.addNewPosition(event.viewPosition);
        this.invalidate();
        return HandleEventResult.EVENT_HANDLED;
    }

    private onDoubleClick = function (event?: GestureEvent) {
        // @ts-ignore
        this._measurement.stopMeasures();
        // @ts-ignore
        this.invalidate();
        return HandleEventResult.EVENT_HANDLED;
    };

    private init  (map: Map) {
        const mapReference = map.reference; // "EPSG:4978"
        const shapeReference = ReferenceProvider.getReference("EPSG:4326"); // 3D WGS:84

        const geoContext = {
            geodesy: GeodesyFactory.createCartesianGeodesy(mapReference),
            mapReference,
            modelToWorldTx: TransformationFactory.createTransformation(shapeReference, mapReference),
            shapeReference,
            viewToWorldTx: map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE),
            worldToModelTx: TransformationFactory.createTransformation(mapReference, shapeReference),
        };

        this._measurement = new Measurement(geoContext);
        this._presentation = Ruler3DPresentation.createPresentation(geoContext);
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            if (this._enabled===false) {
                this._measurement.stopMeasures();
                this.invalidate();
            }
            this._eventSupport.emit(Ruler3DController.ENABLED_CHANGE_EVENT, enabled);
        }
    }
}

export default Ruler3DController;
