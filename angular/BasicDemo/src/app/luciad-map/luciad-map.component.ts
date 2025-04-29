import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {ModelFactory} from "./factories/ModelFactory";
import {LayerFactory} from "./factories/LayerFactory";
import {
  attachPanoControllerToMap,
  attachPanoToMap,
  detachPanoFromMap
} from "./controls/panocontroller/actions/PanoAttach";
import {PanoramaActions} from "./controls/panocontroller/actions/PanoramaActions";
import {UICommand} from "../services/interfaces/UICommand";
import {UICommandsService} from "../services/uicommands.service";
import {UICommandActions} from "../interfaces/UICommandActions";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {CreateNewLayer} from "./factories/CreateNewLayer";
import {ConnectPanels} from "../interfaces/ConnectPanels";
import {MainMapService} from "../services/main-map.service";
import {NgxJsonContextmenuService} from "ngx-json-contextmenu";
import {ContextMenu, ContextMenuItem} from "@luciad/ria/view/ContextMenu";
import {PortAssetStoreService} from "../services/port-asset-store.service";
import {
  ContextMenuOnClosestSurfaceControllerEvent
} from "./controls/contextmenuonclosestsurface/ContextMenuOnClosestSurfaceController";
import {ConfigureLightningSettingsService} from "../forms/lightning-settings/configure-lightning-settings.service";
import {
  BINGMAPS_AERIAL,
  Bundeswasserstraßen,
  WMS_HAMBURG_RGB,
  WMS_LayerGroup,
  WMS_PEGEOnline
} from "./commands/CreateLayerCommands";
import {DistanceAwarePainter} from "./painters/distance/DistanceAwarePainter";


@Component({
  selector: 'app-luciad-map',
  templateUrl: './luciad-map.component.html',
  styleUrls: ['./luciad-map.component.css']
})
export class LuciadMapComponent  implements OnInit, OnDestroy {
  public map: WebGLMap | null =  null;
  public panoramaModeEnabled: boolean = false;
  public panoAnimationActive: boolean = false;
  private currentPanoCameraPoint: number[] = [];
  public activeTab: ConnectPanels = ConnectPanels.WMS;

  constructor(
    private uiCommand: UICommandsService,
    private mainMapService: MainMapService,
    private ngxJsonContextmenuService: NgxJsonContextmenuService,
    private portAssetStoreService: PortAssetStoreService,
    private configureLightningSettingsService: ConfigureLightningSettingsService
  ) {
    uiCommand.onCommand().subscribe((command: UICommand)=>{
      this.processCommand(command);
    })
  }

  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  ngAfterViewInit() {
    // Changes to binded map not allowed directly inside ngAfterViewInit, therfore a setTimeout is added to force execute at the end of the loop
    setTimeout(()=>{
      if (this.mapContainer !== null) {
        const reference = getReference("EPSG:4978")
        this.map = new WebGLMap(this.mapContainer.nativeElement, {reference});
        this.configureLightningSettingsService.applyCurrentSettingsToMap(this.map);

        if (this.map.mapNavigator.constraints.above) this.map.mapNavigator.constraints.above.minAltitude = 0.5;

        this.mainMapService.setMap(this.map);
        this.map.onShowContextMenu = this.onShowContextMenu;
        attachPanoToMap(this.map, (value)=>{
          this.panoramaModeEnabled = value;
        }, (value)=>{
          this.panoAnimationActive = value;
          if (value===false && this.map) {
            this.currentPanoCameraPoint = [this.map.camera.eyePoint.x, this.map.camera.eyePoint.y, this.map.camera.eyePoint.z];
          }
        });
        this.setListeners();
        this.initializeMap();
        // this.testController();
        console.log("Map was created");
      }else {
        console.log("It's null");
      }
    },0)
  }

  private onShowContextMenu = (position: number[], contextMenu: ContextMenu) => {
    const menu = this.ngxJsonContextmenuService;
    (this.map as any).contextMenuHandled = true;
    if (menu) {
      const clientX = position[0];
      const clientY =  position[1];

      const menuItems: ContextMenuItem[] = contextMenu.items;
      menu.openMenuXY(clientX, clientY, menuItems);
    }
  }

  public ngOnDestroy() {
    if(this.map) detachPanoFromMap(this.map);
    this.map?.destroy();
    console.log("Map was destroyed");
  }

  private async initializeMap() {
    await this.processCommand(BINGMAPS_AERIAL);
    await this.processCommand(WMS_LayerGroup);
    this.processCommand(WMS_HAMBURG_RGB);
    this.processCommand(Bundeswasserstraßen);
    this.processCommand(WMS_PEGEOnline);


    const model3D = await ModelFactory.createOgc3DTilesModel({
      "url": "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json",
      "credentials": false,
      "requestHeaders": {},
      "requestParameters": {},
    });

    const layer3D = await LayerFactory.createOgc3DTilesLayer(model3D, {
      label: "Lucerne Mesh",
      offsetTerrain: true,
      isDrapeTarget: true,
      idProperty: "FeatureID",
      selectable: false
    });

    layer3D.onCreateContextMenu = (contextMenu: ContextMenu, map: any, contextMenuInfo: any) => {
      contextMenu.addItem({label:"Select mesh", action: ()=>{
        }});
      contextMenu.addItem({label:"Mesh explore", action: ()=>{
        }});
    };

    const lucerneGroup = await LayerFactory.createLayerGroup({label: "Lucerne"});
    this.map?.layerTree.addChild(lucerneGroup);


//    lucerneGroup.addChild(layer3D);
    this.map?.layerTree.addChild(layer3D);


    this.map?.mapNavigator.fit({bounds: layer3D.bounds, animate: true});


    const panoModelOptions = {
      "url": "https://sampledata.luciad.com/data/panoramics/LucernePegasus/cubemap_final.json",
      "crs": "urn:ogc:def:crs:EPSG::4326",
      "credentials": false,
      "requestHeaders": {},
    }
    const panoModel = await ModelFactory.createPanoramicsModel(panoModelOptions);
    const panoLayer = await LayerFactory.createPanoramicsLayer(panoModel, {
      "iconHeightOffset": 2.5,
      "editable": false,
      "selectable": false,
      "label": "Lucerne Panoramics",
      "id": "1ad0d3ca-f77c-4f25-9e31-ee1917aa110d",
      "parent_id": "83fd6da4-04fb-404f-82ed-ac96af409fc4",
      "visible": true,
      "treeNodeType": "LAYER_FEATURE"
    }, panoModelOptions);
    lucerneGroup.addChild(panoLayer);

    if (this.map) attachPanoControllerToMap(this.map);

    const featureModel = await ModelFactory.createMemoryFeatureModel({url:"./assets/data/osm_pois.json"});
    const featureLayer = await LayerFactory.createEditableFeatureLayer(featureModel, {label: "OSM", selectable: true});

    if (this.map) {
      featureLayer.painter = new DistanceAwarePainter(this.map);
      this.map.layerTree.addChild(featureLayer);
    }

    // const annotationsModel = await ModelFactory.createMyJSONOnlineFeatureModel({collection: "409c809f-9405-479d-8c4b-1d00fcc8c892"});
    if(this.map) this.portAssetStoreService.addPortAssetsLayerToMap(this.map).subscribe();
  }

  closePanorama() {
    if (this.map && (this.map as any)._myPanoramaActions) {
      const panoActions = (this.map as any)._myPanoramaActions as PanoramaActions;
      if (panoActions.isInPanoramaMode()) {
        panoActions.leavePanoramaMode()
      }
    }
  }

  private setListeners() {
    const closePanoramaViewOnInvalidMove = () => {
      if (this.panoAnimationActive===false && this.panoramaModeEnabled && this.map) {
        const map = this.map;
        const newPoint = [map.camera.eyePoint.x, map.camera.eyePoint.y, map.camera.eyePoint.z];
        if ( !(this.currentPanoCameraPoint[0] === newPoint[0] &&
          this.currentPanoCameraPoint[1] === newPoint[1] &&
          this.currentPanoCameraPoint[2] === newPoint[2])) {
          this.closePanorama();
        }
      }
    }
    const mapBoundsHaveChanged = () => {
      closePanoramaViewOnInvalidMove();
    }
    if(this.map) {
      this.map.on('MapChange', mapBoundsHaveChanged);
    }
  }

  private processCommand(command: UICommand) {
     //  Implement layer creation here!!
    return new Promise(resolve=>{
      if (command.action===UICommandActions.CreateAnyLayer) {
        console.log(command);
        CreateNewLayer(command.parameters).then((layer: any)=> {
          if (layer && this.map) {
            if (command.parameters.parentId) {
              const parentNode = this.map.layerTree.findLayerGroupById(command.parameters.parentId);
              if (parentNode) {
                parentNode.addChild(layer);
              }
            } else {
              this.map.layerTree.addChild(layer);
            }
            if (layer instanceof FeatureLayer) {
              if (LayerFactory.isFusionPanoramaLayer(layer)) {
                attachPanoControllerToMap(this.map);
              }
            }
            if (command.parameters.autoZoom){
              LayerFactory.getLayerBounds(layer).then(bounds=>{
                this.map?.mapNavigator.fit({bounds, animate: true});
              });
            }
          }
          resolve(true);
        });
      }
    })

  }

  protected readonly ConnectPanels = ConnectPanels;

  setActive(panel: ConnectPanels) {
    this.activeTab = panel;
  }

  ngOnInit(): void {
  }

}
