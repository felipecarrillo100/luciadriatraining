import {Component, Input} from '@angular/core';
import {TreeNode} from "../interfaces/TreeNode";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {LayerFactory} from "../../luciad-map/factories/LayerFactory";
import {LayerTypesEnum} from "../interfaces/LayerTypesEnum";
import {GroupState} from "../utils/GroupState";
import {LayerGroup} from "@luciad/ria/view/LayerGroup";
import {MenuItemEntry, NgxJsonContextmenuService} from "ngx-json-contextmenu";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {PaintRepresentation} from "@luciad/ria/view/PaintRepresentation";
import {IconName} from "@fortawesome/free-brands-svg-icons";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer";
import {Cursor} from "@luciad/ria/model/Cursor";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec";
import FileUtils from "../../luciad-map/utils/FileUtils";
import {Layer} from "@luciad/ria/view/Layer";

@Component({
  selector: 'app-layer-control-node',
  templateUrl: './layer-control-node.component.html',
  styleUrls: ['./layer-control-node.component.css']
})
export class LayerControlNodeComponent {
  private _node: TreeNode | null = null;
  private _map: WebGLMap | null = null;

  @Input()
  public groupState: GroupState | null = null;

  @Input()
  get node(): TreeNode | null {
    return this._node;
  }

  set node(value: TreeNode | null) {
    this._node = value;
  }

  @Input()
  get map() {
    return this._map;
  }
  set map(value: WebGLMap | null) {
    if (this._map) {
      this._map = null;
    } else {
      this._map = value;
    }
  }

  constructor(private ngxJsonContextmenuService: NgxJsonContextmenuService ) {
  }

  private findLayerOrGroupById(id: string) {
    if (!this._map) { return null}
    const layer = this._map.layerTree.findLayerById(id);
    if (layer) return layer;
    const group = this._map.layerTree.findLayerGroupById(id);
    if (group) return group;
    return null;
  }

  private onNodeMove(nodeId: string, targetId: string, referece: "above" | "below") {
    if (this.map && this.groupState) {
      const lNode = this.findLayerOrGroupById(nodeId);
      const target = this.findLayerOrGroupById(targetId);
      if (lNode && target) {
        if (target instanceof LayerGroup && referece==="below" && !this.groupState.get(targetId)) {
          const group = target as LayerGroup;
          group.moveChild(lNode, "top");
        } else {
          const parent = target.parent;
          if (parent) {
            parent.moveChild(lNode, referece,target);
          }
        }
      }
    }
  }

  public toggleCollaped = (node: TreeNode)=>{
    if (this.groupState) {
      if (node.type===LayerTypesEnum.LayerGroup) {
        const currentvalue = this.groupState.get(node.id);
        this.groupState.update(node.id, !currentvalue);
      }
    }
  };

  public iconProvider = (node:TreeNode): IconName => {
    const icon: IconName = 'image';
    switch (node.type) {
      case LayerTypesEnum.ElevationLayer:
        return "mountain";
      case LayerTypesEnum.HSPCLayer:
        return "cubes-stacked";
      case LayerTypesEnum.TileSet3DLayer:
        return 'cubes';
      case LayerTypesEnum.PanoramicLayer:
      case LayerTypesEnum.CustomPanoramicLayer:
        return 'street-view';
      case LayerTypesEnum.FeatureLayer:
        return 'draw-polygon';
    }
    return icon;
  }

  public hintProvider = (node:TreeNode): string => {
    const title = 'Raster';
    switch (node.type) {
      case LayerTypesEnum.LayerGroup:
        return "Layer group";
      case LayerTypesEnum.ElevationLayer:
        return "Elevation layer";
      case LayerTypesEnum.HSPCLayer:
        return "Point-cloud layer";
      case LayerTypesEnum.TileSet3DLayer:
        return 'Mesh layer';
      case LayerTypesEnum.PanoramicLayer:
      case LayerTypesEnum.CustomPanoramicLayer:
        return 'Panoramic layer';
      case LayerTypesEnum.FeatureLayer:
        return 'Feature Layer';
    }
    return title;
  }
  public toggleNodeVisibility = (node: TreeNode)=>{
    if (this._map) {
      const l = this.findLayerOrGroupById(node.id);
      if (l){
        l.visible = !l.visible;
      }
    }
  };

  public toggleNodeSelectable = (node: TreeNode)=>{
    if (this._map) {
      const l = this.findLayerOrGroupById(node.id) as FeatureLayer;
      if (l){
        l.visible = !l.visible;
        l.selectable = !l.selectable;
        l.visible = !l.visible;
      }
    }
  };

  public toggleNodeTransparency = (node: TreeNode)=>{
    if (this._map) {
      const l = this.findLayerOrGroupById(node.id) as TileSet3DLayer;
      if (l){
        l.visible = !l.visible;
        l.transparency = !l.transparency;
        l.visible = !l.visible;
      }
    }
  };


  public toggleNodeLabelVisibility= (node: TreeNode)=>{
    if (this._map) {
      const l = this.findLayerOrGroupById(node.id);
      if (l instanceof FeatureLayer && l.isPaintRepresentationSupported(PaintRepresentation.LABEL)) {
        l.setPaintRepresentationVisible(PaintRepresentation.LABEL, !node.properties.labels);
      }
    }
  };

  public deleteLayer= (node: TreeNode)=>{
    if (this._map) {
      const l = this.findLayerOrGroupById(node.id);
      if (l){
        l.parent?.removeChild(l);
      }
    }
  };

  public contextmenu = (event: MouseEvent) => {
    if (this._map && this.node) {
      let featureLayerContextmenu: MenuItemEntry[] = [];
      if (this.node.type===LayerTypesEnum.FeatureLayer) {
        featureLayerContextmenu = [
          {divider:true},
          {label: "Selectable", icon:"hand-pointer", action: ()=>{this.node && this.toggleNodeSelectable(this.node)}, checkbox: {value: this.node.properties.selectable as boolean}},
          {label: "Show labels", icon:"tag", action: ()=>{this.node && this.toggleNodeLabelVisibility(this.node)}, checkbox: {value: this.node.properties.labels as boolean}},
          {label: "Export", icon:"download", action: ()=>{this.node && this.export(this.node)}}
        ]
      }
      let tileSet3DLayerContextmenu: MenuItemEntry[] = [];
      if (this.node.type===LayerTypesEnum.TileSet3DLayer) {
        tileSet3DLayerContextmenu = [
          {label: "Selectable", icon:"hand-pointer", action: ()=>{this.node && this.toggleNodeSelectable(this.node)}, checkbox: {value: this.node.properties.selectable as boolean}},
          {label: "Transparency", icon:"eye", action: ()=>{this.node && this.toggleNodeTransparency(this.node)}, checkbox: {value: this.node.properties.transparency as boolean}},
        ]
      }
      const contextmenu: MenuItemEntry[] = [
        {label: "Delete", icon:"trash", action: ()=>{this.node && this.deleteLayer(this.node)} },
        {divider:true},
        {label: "Visible", icon:"eye", action: ()=>{this.node && this.toggleNodeVisibility(this.node)}, checkbox: {value: this.node.properties.visible}},
        {label: "Fit to layer", icon:"expand", action: ()=>{this.node && this.fitToLayer(this.node)}},
        ...tileSet3DLayerContextmenu,
        ...featureLayerContextmenu
      ];
      this.ngxJsonContextmenuService.openMenuEvent(event, contextmenu)
    }
  }

  public fitToLayer = (node: TreeNode)=>{
    if (this._map) {
      const l = this._map.layerTree.findLayerById(node.id);
      LayerFactory.getLayerBounds(l).then(bounds=>{
        this._map?.mapNavigator.fit({bounds, animate: true});
      })
    }
  };
  protected readonly LayerTypesEnum = LayerTypesEnum;

  handleDragStart = (e: DragEvent) => {
    if (this.node) {
      if (e.dataTransfer) {
        e.dataTransfer.setData('text', this.node.id);
      }
      (e.currentTarget as any).classList.add("drag-start");
    }
  }
  handleDragEnd = (e: DragEvent) => {
    if (this.node) {
      (e.currentTarget as any).classList.remove("drag-start");
    }
  }

  handleDrag = ($event: DragEvent) => {
    // Do nothing for now
  }

  handleDragOver = (e: DragEvent) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    const item = e.currentTarget as HTMLDivElement;
    const boundingRect = item.getBoundingClientRect();
    const middleOfDiv = boundingRect.top + (boundingRect.height / 2);
    if (e.clientY < middleOfDiv) {
      item.classList.remove("drag-below");
      item.classList.add("drag-above");
    } else {
      item.classList.remove("drag-above");
      item.classList.add("drag-below");
    }
  }
  handleOverDrop = (e: DragEvent) => {
    function InvertPosition(position: any) {
      return position;
    }

    e.preventDefault();
    if (this.node) {
      if (e.type !== "drop") {
        return;
      }
      // Stores dragged elements ID in var draggedId

      let draggedId;
      if (e.dataTransfer) {
        draggedId = e.dataTransfer.getData("text");
      }
      else if ((e as any).originalEvent.dataTransfer) {
        draggedId = (e as any).originalEvent.dataTransfer.getData("text");
      }


      const isAbove = (e.currentTarget as any).classList.contains("drag-above");
      const isBelow = (e.currentTarget as any).classList.contains("drag-below");

      (e.currentTarget as any).classList.remove("drag-enter", "drag-above", "drag-below");

      if (draggedId === this.node.id) {
        return;
      }

      const reference = isAbove ? "above" : "below";
      this.onNodeMove(draggedId, this.node.id, reference)
    }

  }
  handleDragEnterLeave = (e: DragEvent) => {
    if (e.type === "dragenter") {
      (e.currentTarget as any).classList.add("drag-enter");
    } else {
      (e.currentTarget as any).classList.remove("drag-enter", "drag-above", "drag-below");
    }
  }


  private export(node: TreeNode) {
    if (this._map) {
      const l = this._map.layerTree.findLayerById(node.id);
      const layer = l as FeatureLayer;
      const model = layer.model;
      const store = layer.model.store;
      const promiseToCursor = new Promise<Cursor>(resolve=>{
        const pc = store.query();
        if (typeof (pc as any).then !== "undefined") {
          (pc as any).then((cursor:any)=>resolve(cursor))
        } else {
          resolve(pc)
        }
      })
      promiseToCursor.then((cursor: Cursor)=>{
        const geoJSONCodec= new GeoJsonCodec({});
        const result = geoJSONCodec.encode(cursor);
        FileUtils.download(result.content, `${node.label}.json`, result.contentType);
      })
    }

  }
}
