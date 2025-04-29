import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';

import {Controller} from '@luciad/ria/view/controller/Controller.js';

import GizmoCircles from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_circles.glb";
import GizmoArrows from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_arrows.glb";
import GizmoOctahedron from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_octhedron.glb";
import {ModelFactory} from '../../../modules/luciad/factories/ModelFactory';
import {LayerFactory} from '../../../modules/luciad/factories/LayerFactory';
import {MapLayerCommandsService} from '../../services/map-layer-commands.service';
import {UICommand} from '../../../modules/luciad/interfaces/UICommand';
import {UICommandActions} from '../../../modules/luciad/interfaces/UICommandActions';
import {CreateNewLayer} from '../../../modules/luciad/factories/CreateNewLayer';
import {Layer} from '@luciad/ria/view/Layer.js';

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
  private mapLayerCommandsService = inject(MapLayerCommandsService);

  // IMPORTANT: The div component must be set to static:true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  // Initialize map
  private defaultController: Controller | null = null;
  ngOnInit(): void {
    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
      this.initializeMap();
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  // Destroy map
  ngOnDestroy(): void {
    this.map?.destroy();
  }


  async initializeMap() {
    if (this.map) {
      this.mapLayerCommandsService.onCommand().subscribe((command)=>{
         this.processCommand(command);
      })
    }
  }

  private async processCommand(command: UICommand) {
    if (command.action === UICommandActions.CreateAnyLayer) {
      this.createAnyLayer(command);
    }
  }

  private async createAnyLayer(command: UICommand) {
    const node = await CreateNewLayer(command.parameters);
    if (this.map) {
      this.map.layerTree.addChild(node);
      if (node instanceof Layer ) {
        const layer = node as any;
        if (layer.bounds) this.map.mapNavigator.fit({bounds: layer.bounds});
      }
    }
  }
}




