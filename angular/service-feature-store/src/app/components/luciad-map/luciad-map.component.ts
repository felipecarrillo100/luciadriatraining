import {Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';
import {Controller} from '@luciad/ria/view/controller/Controller.js';


import GizmoCircles from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_circles.glb";
import GizmoArrows from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_arrows.glb";
import GizmoOctahedron from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_octhedron.glb";
import {MapLayerCommandsService} from '../../services/map-layer-commands.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {UICommand} from '../../../modules/luciad/interfaces/UICommand';
import {UICommandActions} from '../../../modules/luciad/interfaces/UICommandActions';
import {CreateNewLayer} from '../../../modules/luciad/factories/CreateNewLayer';
import {LayerTreeNode} from '@luciad/ria/view/LayerTreeNode.js';
import {LayerGroup} from '@luciad/ria/view/LayerGroup.js';
import {LayerFactory} from '../../../modules/luciad/factories/LayerFactory';

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
  private destroyRef = inject(DestroyRef);

  // IMPORTANT: The div component must be set to static:true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  // Initialize map
  private defaultController: Controller | null = null;
  ngOnInit(): void {
    this.mapLayerCommandsService
      .onCommand()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((command: UICommand) => {
        this.processCommand(command);
      });

    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
      this.InitializeMap(this.map);
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  // Destroy map
  ngOnDestroy(): void {
    this.map?.destroy();
  }


  InitializeMap(map: WebGLMap) {

  }

  private async processCommand(command: UICommand): Promise<boolean> {
    if (command.action === UICommandActions.CreateAnyLayer) {
      const layer = await this.createAnyLayer(command);
      return !!layer;
    }

    return false;
  }

  // Used here and in VisibilityBoxSupport.ts
  public async createAnyLayer(command: UICommand, layerGroup?: LayerGroup): Promise<LayerTreeNode | null> {
    const layer = await CreateNewLayer(command.parameters);

    if (!layer || !this.map) return null;

    // Avoid duplications
    const layerById = this.map.layerTree.findLayerTreeNodeById(layer.id);
    if (layerById) return null;

    if (layerGroup) {
      layerGroup.addChild(layer);
    } else if (command.parameters.parentId) {
      const parentNode = this.map.layerTree.findLayerGroupById(command.parameters.parentId);
      if (parentNode) {
        parentNode.addChild(layer);
      }
    } else {
      if (layer.id === 'BingmapsLayer') {
        this.map.layerTree.addChild(layer, 'bottom');
      } else {
        this.map.layerTree.addChild(layer);
      }
    }

    if (command.parameters.autoZoom) {
      const bounds = await LayerFactory.getLayerBounds(layer);
      this.map?.mapNavigator?.fit({ bounds, animate: true });
    }

    return layer;
  }
}
