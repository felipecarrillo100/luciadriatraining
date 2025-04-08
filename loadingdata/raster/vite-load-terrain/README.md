## Adding an Elevation Layer to LuciadRIA

LuciadRIA utilizes the LTS protocol for its elevation layer, represented by the `FusionTileSetModel`.

To add an elevation layer, follow these steps:

1. **Create a Model**: Utilize the `FusionTileSetModel` to access LTS data.
2. **Assign the Model to a Layer**: Employ the `RasterTileSetLayer` to visually represent the model.
3. **Insert the Layer into the Map**: Add the layer to the map's `layerTree`.

The LuciadRIA API offers robust models and layers for accessing and displaying WMS data:

For more information, refer to the documentation for:

- **Model**: `FusionTileSetModel` handles LTS data.
- **Layer**: `RasterTileSetLayer` visualizes the model on the map as elevation.

For detailed documentation, refer to:

- [FusionTileSetModel Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_model_tileset_FusionTileSetModel.FusionTileSetModel-1.html)
- [RasterTileSetLayer Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_view_tileset_RasterTileSetLayer.RasterTileSetLayer.html)

Note that the current version of LuciadRIA supports only one elevation layer at a time.

### Method: Using `FusionTileSetModel.createFromURL`

An efficient approach to load LTS data is to use:

```typescript
function LoadTerrain(map: WebGLMap) {
    const ltsUrl = "https://sampleservices.luciad.com/lts";
    const layerImageryName = "world_elevation_6714a770-860b-4878-90c9-ab386a4bae0f";

    // Adds a WMS layer as a background
    FusionTileSetModel.createFromURL(ltsUrl, layerImageryName, {}).then((model: FusionTileSetModel) => {
        const layer = new RasterTileSetLayer(model, {
            label: "Elevation Layer",
        });
        map.layerTree.addChild(layer);
    });
}
```
