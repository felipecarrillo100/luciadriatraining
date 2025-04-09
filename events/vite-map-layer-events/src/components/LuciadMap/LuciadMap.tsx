import React, {useEffect, useRef, useState} from "react";
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import "./LuciadMap.css";
import {WMSTileSetLayer} from "@luciad/ria/view/tileset/WMSTileSetLayer.js";
import {WMSTileSetModel} from "@luciad/ria/model/tileset/WMSTileSetModel.js";
import {FusionTileSetModel} from "@luciad/ria/model/tileset/FusionTileSetModel.js";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer.js";
import {LayerTree} from "@luciad/ria/view/LayerTree.js";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode.js";

interface SimplifiedNode {
    label: string;
    id: string;
    children?: SimplifiedNode[];
}

const TreeRenderer: React.FC<{ node: SimplifiedNode, onDelete: (id: string)=> (event: any) => void }> = ({ node, onDelete }) => {
    return (
        <div style={{ marginLeft: '20px' }}>
            <div title={node.id}>{node.label}
                <button style={{backgroundColor: "gray", padding: 0, margin: 0}} onClick={onDelete(node.id)}>Delete</button>
            </div>
            {node.children && node.children.length > 0 && (
                <div>
                    {node.children.map((child, index) => (
                        <TreeRenderer key={index} node={child} onDelete={onDelete}/>
                    ))}
                </div>
            )}
        </div>
    );
};

export const LuciadMap: React.FC = () => {
    const divElement = useRef(null as null | HTMLDivElement);
    const nativeMap = useRef(null as null | WebGLMap);

    const [layerTree, setLayerTree] = useState(null as SimplifiedNode | null);

    const onDelete = (id: string) => () => {
        console.log(id);
        if (nativeMap.current) {
            const node = nativeMap.current.layerTree.findLayerTreeNodeById(id);
            if (node) {
                const parent = node.parent;
                parent?.removeChild(node);
            }
        }
    }

    useEffect(()=>{
        // Initialize Map
        if (divElement.current!==null) {
            nativeMap.current = new WebGLMap(divElement.current, {reference: getReference("EPSG:4978")});
            AddMapChageListener(nativeMap.current);
            AddLayerTreeListeners(nativeMap.current, setLayerTree);
            LoadLayers(nativeMap.current);
        }
        return ()=>{
            // Destroy map
            if (nativeMap.current) nativeMap.current.destroy();
        }
    },[])
    return (<div className="LuciadMap" >
        <div className="map-element" ref={divElement} />
        <div className="layertree-container">
            {layerTree && layerTree.children && layerTree.children.length > 0 && (
                <div>
                    {layerTree.children.map((child) => (
                        <TreeRenderer key={child.id} node={child} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    </div>)
}


function AddMapChageListener(map: WebGLMap) {
    map.on("MapChange", () => {
        const boundsArray = map.getMapBounds();
        boundsArray.map(bounds=>console.log(`Bounds: [x:${bounds.x},w: ${bounds.width}, y:${bounds.y}, h:${bounds.height}]`));
    });
}
function AddLayerTreeListeners(map: WebGLMap, setLayerTree: (o:SimplifiedNode)=>void) {

    const simplifyTree = (tree: LayerTree): SimplifiedNode => {
        // Recursively traverse the tree and build the simplified structure
        const simplifyNode = (node: LayerTreeNode): SimplifiedNode => {
            const simplifiedNode: SimplifiedNode = { label: node.label, id: node.id };

            if (node.children && node.children.length > 0) {
                // Check if the current node has children
                // If it does, we need to process each child node to convert it into the simplified structure

                // Initialize an empty array to hold the simplified child nodes
                const simplifiedChildren: SimplifiedNode[] = [];

                // Iterate over each child node
                node.children.forEach((child: LayerTreeNode) => {
                    // Simplify the current child node by calling simplifyNode recursively
                    const simplifiedChild = simplifyNode(child);

                    // Add the simplified child node to the array of simplified children
                    simplifiedChildren.push(simplifiedChild);
                });

                // Assign the array of simplified child nodes to the children property of the simplified node
                simplifiedNode.children = simplifiedChildren;
            }

            return simplifiedNode;
        };

        return simplifyNode(tree);
    };
    const layerTreeHasChanged = () => {
        console.log("LayerTree has changed!!")
        const sLayerTree = simplifyTree(map.layerTree);
        setLayerTree(sLayerTree);
    }

    map.layerTree.on("NodeAdded", layerTreeHasChanged);
    map.layerTree.on("NodeRemoved", layerTreeHasChanged);
    map.layerTree.on("NodeMoved", layerTreeHasChanged);
}
function LoadLayers(map: WebGLMap) {
    LoadTerrain(map);
    const wmsUrl = "https://sampleservices.luciad.com/wms";
    const imagery = [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}];

    // Method 3: createFromURL (GetCapabilities is called behind the scenes)
    WMSTileSetModel.createFromURL(wmsUrl, imagery, {}).then((model: WMSTileSetModel) => {
        const layer = new WMSTileSetLayer(model, {label: "Imagery"});
        map.layerTree.addChild(layer);
    });
}


function LoadTerrain(map: WebGLMap) {
    const ltsUrl = "https://sampleservices.luciad.com/lts";
    const layerImageryName = "world_elevation_6714a770-860b-4878-90c9-ab386a4bae0f";

    // Adds a WMS layer as a background
    FusionTileSetModel.createFromURL(ltsUrl, layerImageryName, {}).then((model:FusionTileSetModel) => {
        const layer = new RasterTileSetLayer(model, {
            label: "Elevation layer",
        });
        map.layerTree.addChild(layer);
    });
}
