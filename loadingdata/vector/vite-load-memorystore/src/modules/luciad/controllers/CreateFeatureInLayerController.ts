import {BasicCreateController} from "@luciad/ria/view/controller/BasicCreateController.js";
import {ShapeType} from "@luciad/ria/shape/ShapeType.js";
import {FeatureId, FeatureProperties} from "@luciad/ria/model/feature/Feature.js";
import {CreateControllerConstructorOptions} from "@luciad/ria/view/controller/CreateController.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {Map} from "@luciad/ria/view/Map.js";
import {Controller} from "@luciad/ria/view/controller/Controller.js";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas.js";
import {Feature} from "@luciad/ria/model/feature/Feature.js";


interface CreateFeatureInLayerControllerOptions extends CreateControllerConstructorOptions {
    layer: FeatureLayer;
    onSuccess?: (feature: Feature, layer: FeatureLayer) => void;
    onFailure?: ((reason: {message: string }) => void) | undefined;
    fallbackController?: Controller;
    forceID?: FeatureId;
}
export class CreateFeatureInLayerController extends BasicCreateController {
    private onSuccess: ((feature: Feature, layer: FeatureLayer) => void) | undefined;
    private onFailure: ((reason: {message: string }) => void) | undefined;
    private layer: FeatureLayer;
    private editCompleted: boolean;
    private editSuccessfully: boolean;
    private fallbackController: Controller | undefined;
    private forceID: FeatureId | undefined;
    private sharableShapeType: ShapeType;
    private reason: { message: string } | undefined ;

    constructor(shapeType: ShapeType, defaultProperties?: FeatureProperties, options?: CreateFeatureInLayerControllerOptions) {
        const newOptions = options ? {...options} : {} as CreateFeatureInLayerControllerOptions;
        super(shapeType, defaultProperties, newOptions as CreateControllerConstructorOptions);
        this.onSuccess = newOptions.onSuccess;
        this.onFailure = newOptions.onFailure;
        this.fallbackController = newOptions.fallbackController;
        this.forceID =  newOptions.forceID;
        this.layer = newOptions.layer;
        this.editCompleted = false;
        this.editSuccessfully = false;
        this.sharableShapeType =  shapeType;
    }

    public onChooseLayer = (): FeatureLayer => {
        return this.layer as FeatureLayer;
    };
    public onDeactivate(map: Map){
        super.onDeactivate(map);
        if (this.editCompleted && this.fallbackController) map.controller = this.fallbackController;
        if (typeof this.onFailure === "function") {
            if (this.editSuccessfully) {
                if (this.reason) this.onFailure(this.reason); this.onFailure({message: ""})
            }
        }
    }

    public onCreateNewObject(aMapView: Map, aLayer: FeatureLayer) {
        // Change if needed
        return super.onCreateNewObject(aMapView, aLayer);
    }
    public onDraw(geoCanvas: GeoCanvas) {
        // Change if needed
        super.onDraw(geoCanvas);
    }

    public onObjectCreated(aMapView: Map, aLayer: FeatureLayer, feature: Feature) {
        this.editCompleted = true;

        const layer = aLayer as FeatureLayer;
        let newFeature = feature;

        const targetID = this.forceID !== null ? this.forceID : feature.id;
        if (this.forceID !== null){
            newFeature = new Feature(feature.shape, feature.properties, targetID);
        }

        const model = layer.model as any;
        if (model.add) {
            this.editSuccessfully = true;
            super.onObjectCreated(aMapView, layer, newFeature);
            if (typeof this.onSuccess === "function") {
                this.onSuccess(newFeature, layer)
            }
        }
        else {
            this.reason = {message: "Layer can not be edited:" + layer.label}
        }
    }

    public getShapeType() {
        return this.sharableShapeType;
    }

}
