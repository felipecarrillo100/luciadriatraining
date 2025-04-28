import { Feature, FeatureProperties } from '@luciad/ria/model/feature/Feature';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { BasicCreateController } from '@luciad/ria/view/controller/BasicCreateController';
import { Controller } from '@luciad/ria/view/controller/Controller';
import { Map } from '@luciad/ria/view/Map';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Bounds } from '@luciad/ria/shape/Bounds';
import { Shape } from '@luciad/ria/shape/Shape';
import { Point } from '@luciad/ria/shape/Point';
import GeoTools from '../../../utils/GeoTools';

type CreateFeatureInLayerOnComplete = (feature: Feature, layer?: FeatureLayer) => unknown;

interface CreateFeatureInLayerControllerOptions {
  callOnCompletion?: CreateFeatureInLayerOnComplete;
  forceID?: string;
  createFeature?: boolean;
}

interface CircleShape extends Shape {
  center: Point;
  radius: number;
}

export class CreateFeatureInLayerController extends BasicCreateController {
  private layer: FeatureLayer;
  private fallbackController: Controller | null;
  private callOnCompletion: CreateFeatureInLayerOnComplete | null;
  private promiseResolve: ((value?: PromiseLike<Feature> | Feature) => void) | null;
  private promiseReject: ((reason?: PromiseRejectionEvent) => void) | null;
  private forceID: string;
  private createFeature = true;

  constructor(
    shapeType: ShapeType,
    defaultProperties: unknown,
    layer: FeatureLayer,
    controller: Controller | null,
    options?: CreateFeatureInLayerControllerOptions,
  ) {
    super(shapeType, defaultProperties, { finishOnSingleClick: true });
    options = options ? options : {};

    this.layer = layer;
    this.fallbackController = controller;
    this.createFeature = typeof options.createFeature !== 'undefined' ? options.createFeature : true;
    this.callOnCompletion = typeof options.callOnCompletion === 'function' ? options.callOnCompletion : null;
    this.forceID = typeof options.forceID !== 'undefined' ? options.forceID : undefined;
    this.promiseResolve = null;
    this.promiseReject = null;
  }

  public getPromiseOnFeatureCompletion() {
    return new Promise<Feature>((resolve: ((value?: PromiseLike<Feature> | Feature) => void) | null, reject) => {
      this.promiseResolve = resolve;
      this.promiseReject = reject;
    });
  }

  override onChooseLayer(): FeatureLayer | null {
    return this.layer as FeatureLayer;
  }

  override onDeactivate(map: Map) {
    super.onDeactivate(map);
    map.controller = this.fallbackController;
    if (this.promiseReject) {
      this.promiseReject();
    }
  }
  override onCreateNewObject(aMapView: Map, aLayer: FeatureLayer) {
    const feature = super.onCreateNewObject(aMapView, aLayer);
    return feature;
  }
  override onDraw(geoCanvas: GeoCanvas) {
    super.onDraw(geoCanvas);
  }

  override onObjectCreated(aMapView: Map, aLayer: FeatureLayer, aFeature: Feature): void | Promise<void> {
    const layer = aLayer;
    const feature = aFeature as Feature<Shape, FeatureProperties>;
    let newFeature = feature;
    // If Shape === Bounds it will be converted to a Polygon
    const targetID = this.forceID !== null ? this.forceID : feature.id;
    if (feature.shape.type === ShapeType.BOUNDS) {
      const newShape = GeoTools.createGeoJSONShapeFromBounds(feature.shape as Bounds);
      newFeature = new Feature(newShape, feature.properties, targetID);
    }
    // tslint:disable-next-line:no-bitwise
    else if (ShapeType.CIRCLE_BY_CENTER_POINT & feature.shape.type) {
      const newShape = GeoTools.createDiscreteCircle_SHORTEST_DISTANCE(
        (feature.shape as CircleShape).center,
        (feature.shape as CircleShape).radius,
        60,
      );
      newFeature = new Feature(newShape, feature.properties, targetID);
    } else if (this.forceID !== null) {
      newFeature = new Feature(feature.shape, feature.properties, targetID);
    }
    const model = layer.model;
    if (model.add) {
      const onCompleted = () => {
        if (this.callOnCompletion) {
          this.callOnCompletion(newFeature, layer);
        }
        if (this.promiseResolve) {
          this.promiseResolve(newFeature);
          this.promiseReject = null;
        }
      };
      // super.onObjectCreated(aMapView, layer as any, newFeature);
      newFeature.id = this.forceID;
      if (this.createFeature) {
        this.localOnObjectCreated(aMapView, layer, newFeature).then((id) => {
          newFeature.id = id;
          onCompleted();
        });
      } else {
        onCompleted();
      }
    } else {
      console.error('Layer can not be edited:' + layer.label);
    }
  }

  private localOnObjectCreated(aMapView: Map, aLayer: FeatureLayer, aFeature: Feature) {
    return new Promise<string | number>((resolve) => {
      const n = aLayer.workingSet.add(aFeature) as PromiseLike<string | number>;
      if (n.then) {
        n.then((s: string | number) => resolve(s));
      } else {
        resolve(n);
      }
    });
  }
}
