## Loading Meshes

LuciadRIA is capable to load high resolution meshes to display 3D data. The data can be the result of scanning of real world data or CAD generated data.

For this purpose LuciadRIA uses a protocol known as OGC 3D Tiles. This protocol allows the streaming of data from a server to the web client.

The 3d model is split in a 3-dimentional grid or tiles where low resolution tiles are loaded when the model is observed from far away and as the camera approaches higher resolution tiles are loaded.

As always LuciadRIA uses a model and a layer. 

- https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_model_tileset_OGC3DTilesModel.OGC3DTilesModel.html
- https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_view_tileset_TileSet3DLayer.TileSet3DLayer.html


## Creating a mesh layer

The `OGC3DTilesModel` is initialized in a slightly different manner.  Since the class `constructor` is private, you need to create the model using the method `create`.

The `create` methods performs a query to the server to retrieve all the necessary information to initialize the model before this is created. Then returns the promise as a promise.

See the code snippet below:

```typescript
OGC3DTilesModel.create(url, {}).then(( model: OGC3DTilesModel )=>{
    
    //Create a layer for the model
    const layer = new TileSet3DLayer( model, {
        label: "Mesh Layer",
    });

    //Add the model to the map
    map.layerTree.addChild( layer );

    // Zoom to the layer bounds
    map.mapNavigator.fit({ bounds: layer.bounds, animate: true });

});
```

### Styling mesh data

The layer `TileSet3DLayer` can be styled as described in the documentation
