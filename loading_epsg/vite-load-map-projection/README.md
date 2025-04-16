## Adding a WMS Layer to LuciadRIA

The OGC WMS (Web Map Service) is a standard protocol developed by the Open Geospatial Consortium (OGC) for delivering georeferenced map images over the internet. It allows users to request map images from a server using parameters such as geographic coordinates, image format, and layer visibility, facilitating dynamic map visualization and seamless integration into web applications.

To add a WMS layer to a LuciadRIA map, follow these steps:

1. **Create a Map**: Initialize your map instance.
2. **Create a Model**: Use the `WMSTileSetModel` to access WMS data.
3. **Assign the Model to a Layer**: Use the `WMSTileSetLayer` to visually represent the model.
4. **Insert the Layer into the Map**: Add the layer to the map's `layerTree`.

The LuciadRIA API provides robust models and layers for accessing and displaying WMS data:

- **Model**: `WMSTileSetModel` handles WMS data.
- **Layer**: `WMSTileSetLayer` visualizes the model on the map.

For detailed documentation, refer to:

- [WMSTileSetModel Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/modules/_luciad_ria_model_tileset_WMSTileSetModel.html)
- [WMSTileSetLayer Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/modules/_luciad_ria_view_tileset_WMSTileSetLayer.html)

These resources provide specific guidance on implementing WMS layers in your LuciadRIA application.

### Method 1: Adding a WMS Layer Using the Standard Pattern

To add a WMS layer using the standard approach:

```typescript
const wmsUrl = "URL_OF_WMS_SERVICE";

// Create the model with required options
const model1 = new WMSTileSetModel({
    getMapRoot: wmsUrl,
    layers: [layerImageryName],
    reference: getReference("EPSG:3857"),
    imageFormat: "image/png",
    styles: [],
    transparent: true,
    version: WMSVersion.V130
});

// Create the layer and set the desired label
const layer = new WMSTileSetLayer(model1, { label: "Satellite Images" });

// Insert the layer into the map
map.layerTree.addChild(layer);
```

The `WMSTileSetModel` constructor requires several parameters, which can make the process complex. To simplify model creation, LuciadRIA API offers alternative methods:

### Method 2: Using `WMSTileSetModel.createFromCapabilities`

The LuciadRIA API allows you to query the WMS server for information about layers and configurations using `WMSCapabilities`.

```typescript
// Perform: wmsUrl?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
WMSCapabilities.fromURL(wmsUrl).then((capabilities: WMSCapabilities) => {
    // Create the model with retrieved capabilities; `layersArray` is the list of desired layers
    const model = WMSTileSetModel.createFromCapabilities(capabilities, layersArray);
    // Create the layer as usual
    const layer = new WMSTileSetLayer(model, { label: "States" });
    // Add the layer to the map
    map.layerTree.addChild(layer);
    // Zoom the map to fit the bounds of this layer
    if (model.bounds) map.mapNavigator.fit({ bounds: model.bounds, animate: true });
});
```

### Method 3: Using `WMSTileSetModel.createFromURL`

A more efficient approach is to use:

```typescript
// Create the model with createFromURL; the GetCapabilities is called behind the scenes, `layersRivers` is the list of desired layers
WMSTileSetModel.createFromURL(wmsUrl, layersRivers, {}).then((model: WMSTileSetModel) => {
    // Using the model returned in the promise:
    const layer = new WMSTileSetLayer(model, { label: "Rivers" });
    map.layerTree.addChild(layer);
});
```

This method streamlines the process by directly creating the model from the URL and specified layers.
