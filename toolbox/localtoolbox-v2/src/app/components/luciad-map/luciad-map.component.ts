import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';
import {WMSTileSetModel} from '@luciad/ria/model/tileset/WMSTileSetModel.js';
import {WMSTileSetLayer} from '@luciad/ria/view/tileset/WMSTileSetLayer.js';
import {OGC3DTilesModel} from '@luciad/ria/model/tileset/OGC3DTilesModel.js';
import {TileSet3DLayer} from '@luciad/ria/view/tileset/TileSet3DLayer.js';
import {UrlStore} from '@luciad/ria/model/store/UrlStore.js';
import {FeatureModel} from '@luciad/ria/model/feature/FeatureModel.js';
import {FeatureLayer} from '@luciad/ria/view/feature/FeatureLayer.js';
import {PanoramaFeaturePainter} from '../../../modules/luciad/painters/PanoramaFeaturePainter';
import {CreatePanoramaControllers} from '../../../modules/luciad/pano/controller/CreatePanoramaControllers';
import {FusionPanoramaModel} from '@luciad/ria/model/tileset/FusionPanoramaModel.js';
import {PanoramaActions} from '../../../modules/luciad/pano/actions/PanoramaActions';
import {OrientedBox} from '@luciad/ria/shape/OrientedBox.js';
import {
  BOX_CREATED_EVENT,
  BoxCreateController
} from 'ria-toolbox/libs/slicing/controllers/BoxCreateController';
import {Controller} from '@luciad/ria/view/controller/Controller.js';
import {SceneNavigationController} from 'ria-toolbox/libs/scene-navigation/SceneNavigationController';
import {NavigationType} from 'ria-toolbox/libs/scene-navigation/GestureUtil';
import {NavigationGizmo} from 'ria-toolbox/libs/scene-navigation/NavigationGizmo';

import GizmoCircles from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_circles.glb";
import GizmoArrows from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_arrows.glb";
import GizmoOctahedron from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_octhedron.glb";
import {Ruler3DController} from 'ria-toolbox/libs/ruler3d/Ruler3DController';
import {createMeasurement} from 'ria-toolbox/libs/ruler3d/measurement/MeasurementUtil';
import {DISTANCE_MEASUREMENT_TYPE} from 'ria-toolbox/libs/ruler3d/measurement/DistanceMeasurement';
import {OGC3D_PAINT_STYLES} from '../../../modules/luciad/pano/Ruler3DStyling';
import {AREA_MEASUREMENT_TYPE} from 'ria-toolbox/libs/ruler3d/measurement/AreaMeasurement';
import {MEASUREMENT_CHANGED_EVENT} from 'ria-toolbox/libs/ruler3d/measurement/Measurement';

console.log(GizmoCircles);
console.log(GizmoArrows);
console.log(GizmoOctahedron);

@Component({
  selector: 'app-luciad-map',
  imports: [],
  templateUrl: './luciad-map.component.html',
  styleUrl: './luciad-map.component.scss',
  standalone: true,  // Make the component standalone
})
export class LuciadMapComponent implements OnInit, OnDestroy {
  // IMPORTANT: The div component must be set to static:true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  // Initialize map
  private defaultController: Controller | null = null;
  public area: string = "";
  ngOnInit(): void {
    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
      this.LoadLayers(this.map);
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  // Destroy map
  ngOnDestroy(): void {
    this.map?.destroy();
  }


  default() {
    if (this.map  && this.defaultController) {
      this.map.controller = this.defaultController;
    }
  }

  scene() {
    if (this.map) {
      const gizmos = {
        [NavigationType.ROTATION]: new NavigationGizmo(GizmoCircles),
        [NavigationType.PAN]: new NavigationGizmo(GizmoArrows),
        [NavigationType.ZOOM]: new NavigationGizmo(GizmoOctahedron, {sizeInPixels: 40})
      }
      this.map.controller = new SceneNavigationController(gizmos, this.map.mapBounds);
    }
  }

  ruler()  {
    if (this.map) {
      this.map.controller = new Ruler3DController(createMeasurement(DISTANCE_MEASUREMENT_TYPE),
        {styles: OGC3D_PAINT_STYLES, enabled: true});
    }
  }

  rulerArea()  {
    if (this.map) {
      const measurement = createMeasurement(AREA_MEASUREMENT_TYPE);
        measurement.on(MEASUREMENT_CHANGED_EVENT, ()=>{
          const info = measurement.getFormattedTotalInfo();
          if (info.length>0) {
            this.area = info[0].value
          }
        });
      this.map.controller = new Ruler3DController(measurement,
        {styles: OGC3D_PAINT_STYLES, enabled: true});
    }
  }

  // rulerHeighta()  {
  //   if (this.map) {
  //     const measurement = createMeasurement(AREA_MEASUREMENT_TYPE);
  //     measurement.on(MEASUREMENT_CHANGED_EVENT, ()=>{
  //       const info = measurement.getFormattedTotalInfo();
  //       if (info.length>0) {
  //         this.area = info[0].value
  //       }
  //     });
  //     this.map.controller = new Ruler3DController(measurement,
  //       {styles: OGC3D_PAINT_STYLES, enabled: true});
  //   }
  // }



  LoadLayers(map: WebGLMap) {
    const wmsUrl = "https://sampleservices.luciad.com/wms";

    const layerImageryName = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Adds a WMS layer as a background
    WMSTileSetModel.createFromURL(wmsUrl, layerImageryName, {}).then(async (model: WMSTileSetModel) => {
      const layer = new WMSTileSetLayer(model, {
        label: "Satellite Imagery",
      });
      map.layerTree.addChild(layer);

      // Once whe WMS layer has been loaded the Mesh layer
      addMeshLayer(map).then(()=>{
        this.defaultController = addPanoramaLayer(map);
      });
    });
  }

  box() {
    if (this.map) {
      const createController = new BoxCreateController();
      const createHandle = createController.on(
        BOX_CREATED_EVENT,
        (box: OrientedBox) => {
          createHandle.remove();
          // onChangeController(new BoxSelectController(visibilitySupport, onChangeController));
        }
      );
      this.map.controller = createController;
    }
  }
}






// Adding a Memory Store
function addMeshLayer(map: WebGLMap) {
  return new Promise<TileSet3DLayer>((resolve)=>{
    const url = "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json"
    OGC3DTilesModel.create(url, {}).then((model:OGC3DTilesModel)=>{
      //Create a layer for the model
      const layer = new TileSet3DLayer(model, {
        label: "Mesh Layer",
      });

      //Add the layer to the map
      map.layerTree.addChild(layer);
      resolve(layer);
    });
  });
}

function addPanoramaLayer(map: WebGLMap) {
  const target = "https://sampledata.luciad.com/data/panoramics/LucernePegasus/cubemap_final.json";
  const store = new UrlStore({
    target
  });
  const model = new FeatureModel(store);

  const panoModel = new FusionPanoramaModel(target);

  const layer = new FeatureLayer(model, {
    panoramaModel: panoModel,
    selectable: false,
    hoverable: true,
    painter:new PanoramaFeaturePainter({
      overview: false,
      iconHeightOffset: 0
    })
  });

  //Add the layer to the map
  map.layerTree.addChild(layer);

  //fit on the Panorama layer
  const queryFinishedHandle = layer.workingSet.on("QueryFinished", () => {
    if (layer.bounds) {
      //#snippet layerFit
      map.mapNavigator.fit({
        bounds: layer.bounds,
        animate: true
      });
      //#endsnippet layerFit
    }
    queryFinishedHandle.remove();
  });

  const panoramaActions = new PanoramaActions(map as WebGLMap);

  const controller = CreatePanoramaControllers(panoramaActions, map, layer);
  map.controller = controller;
  return controller;
}
