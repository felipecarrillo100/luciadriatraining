import {Component, Input} from '@angular/core';
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {Handle} from "@luciad/ria/util/Evented";
import {TreeNode} from "./interfaces/TreeNode";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode";
import {LayerGroup} from "@luciad/ria/view/LayerGroup";
import {LayerTypesEnum} from "./interfaces/LayerTypesEnum";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {TileSet3DLayer} from "@luciad/ria/view/tileset/TileSet3DLayer";
import {GroupState} from "./utils/GroupState";
import {PaintRepresentation} from "@luciad/ria/view/PaintRepresentation";
import {LayerFactory} from "../luciad-map/factories/LayerFactory";
import {HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel";
import {RasterDataType} from "@luciad/ria/model/tileset/RasterDataType";

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.css']
})
export class LayerControlComponent {
  private layerEventHandles = {} as any;
  private _map: WebGLMap | null = null ;
  private eventNodeAdded: Handle | null=  null;
  private eventNodeRemoved: Handle | null=  null;
  private eventNodeMoved: Handle | null=  null;
  public root: TreeNode|null =  null;
  public groupState: GroupState;
  public expanded = true;

  constructor() {
    this.groupState = new GroupState()
    this.groupState.subscribe((value)=>{
      if (this._map) {
        this.root = this.loadTreeData(this._map.layerTree);
      }
    })
  }

  @Input()
  get map() {
    return this._map;
  }
  set map(value: WebGLMap | null) {
    if (this._map) {
      this.releaseListeners();
      this._map = null;
    } else {
      this._map = value;
      this.createListeners();
    }
  }

  private releaseListeners = () => {
    if (this.eventNodeAdded) {
      this.eventNodeAdded.remove();
      this.eventNodeAdded =  null
    }
    if (this.eventNodeRemoved) {
      this.eventNodeRemoved.remove();
      this.eventNodeRemoved =  null
    }
    if (this.eventNodeMoved) {
      this.eventNodeMoved.remove();
      this.eventNodeMoved =  null
    }
  }

  private createListeners = () => {
    if (this._map && this._map.layerTree) {
      console.log("Installing listeners!!");
      this.eventNodeAdded = this._map?.layerTree.on("NodeAdded", this.onNodeAdded);
      this.eventNodeRemoved = this._map?.layerTree.on("NodeRemoved", this.onNodeDeleted);
      this.eventNodeMoved = this._map?.layerTree.on("NodeMoved", this.onNodeChange);
    }
  }

  private onNodeAdded = (layerTreeNodeChange: {
    node: LayerTreeNode;
    index: number;
    path: LayerTreeNode[];
  }) => {
    const setVisibilityListener = (node: LayerTreeNode) => {
      const visibilityChange = (visible: boolean) => {
        this.onNodeChange();
      };
      return node.on("VisibilityChanged", visibilityChange);
    }
    const visibilityHandle = setVisibilityListener(layerTreeNodeChange.node);
    const setLabelVisibilityListener = (node: LayerTreeNode) => {
      const labelVisibilityChange = (value: boolean, paintRepresentation: PaintRepresentation) => {
        this.onNodeChange();
      };
      return node.on("PaintRepresentationVisibilityChanged", labelVisibilityChange);
    }

    const visibilityLabelHandle = setLabelVisibilityListener(layerTreeNodeChange.node)

    this.layerEventHandles[layerTreeNodeChange.node.id] = {
      visibilityHandle,
      visibilityLabelHandle
    }

    const type = this.detectType(layerTreeNodeChange.node);
    if (type===LayerTypesEnum.LayerGroup) {
      this.groupState.add(layerTreeNodeChange.node.id, false);
    }

    this.onNodeChange();
  }

  private onNodeDeleted = (layerTreeNodeChange: {
    node: LayerTreeNode;
    index: number;
    path: LayerTreeNode[];
  }) => {
    const handles = this.layerEventHandles[layerTreeNodeChange.node.id];
    if (handles) {
      delete this.layerEventHandles[layerTreeNodeChange.node.id];
      for (const handle in handles) {
        if (handles.hasOwnProperty(handle)) {
          const eventHandle = handles[handle] as Handle;
          eventHandle?.remove();
        }
      }
    }
    const type = this.detectType(layerTreeNodeChange.node);
    if (type===LayerTypesEnum.LayerGroup) {
      this.groupState.remove(layerTreeNodeChange.node.id);
    }
    this.onNodeChange();
  }

  private onNodeChange = () => {
    if (this._map && this._map.layerTree.children) {
      setTimeout(()=>{
        if (this._map) this.root = this.loadTreeData(this._map.layerTree);
      }, 1)
    }
  }


  private detectType(layer:LayerTreeNode) {
    if (layer instanceof LayerGroup) {
      return LayerTypesEnum.LayerGroup
    }
    if (layer instanceof RasterTileSetLayer) {
      const model = layer.model;
      if (model.dataType===RasterDataType.ELEVATION) return LayerTypesEnum.ElevationLayer
      return LayerTypesEnum.RasterTileSetLayer
    }
    if (LayerFactory.isFusionPanoramaLayer(layer)) {
      return LayerTypesEnum.PanoramicLayer
    }
    if (layer instanceof FeatureLayer) {
      return LayerTypesEnum.FeatureLayer
    }
    if (layer instanceof TileSet3DLayer) {
      const model = layer.model;
      if (model instanceof HSPCTilesModel) return LayerTypesEnum.HSPCLayer;
      return LayerTypesEnum.TileSet3DLayer
    }
    return LayerTypesEnum.Unknown;
  }
  private loadTreeData(node: LayerTreeNode) {
    const loadSingle = (node: LayerTreeNode) =>{
      const type = this.detectType(node);
      let collapsed = true;
      if (type===LayerTypesEnum.LayerGroup) {
        collapsed = this.groupState.get(node.id);
      }
      const featureProperties: {labels?:boolean, selectable?: boolean} = {};
      if (node instanceof FeatureLayer) {
        if (node.isPaintRepresentationSupported(PaintRepresentation.LABEL)) {
          featureProperties.labels = node.isPaintRepresentationVisible(PaintRepresentation.LABEL);
        }
        featureProperties.selectable = (node as FeatureLayer).selectable;
      }
      const tiles3DLayerProperties: {transparency?:boolean, selectable?: boolean} = {};
      if (node instanceof TileSet3DLayer ) {
        tiles3DLayerProperties.transparency = (node as TileSet3DLayer).transparency;
        tiles3DLayerProperties.selectable = (node as TileSet3DLayer).selectable;
      }
      const newNode: TreeNode  = {
        label: node.label,
        id: node.id,
        type,
        properties:
          {
            visible: node.visible,
            ...tiles3DLayerProperties,
            collapsed,
            ...featureProperties
          },
        children:[]
      };
      for (const child of node.children) {
        const c = loadSingle(child);
        newNode.children.push(c);
      }
      return newNode;
    }

    return loadSingle(node);
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
}
