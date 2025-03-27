## Adding a WFS Layer to LuciadRIA

The OGC WFS (Web Feature Service) is a standard protocol developed by the Open Geospatial Consortium (OGC) for serving geospatial features over the web. Unlike WMS, which delivers map images, WFS provides access to actual geospatial data, allowing users to query, retrieve, and manipulate vector feature data in formats like GML (Geography Markup Language). This capability facilitates more dynamic and interactive geospatial applications, enabling advanced spatial analysis and data integration.

In LuciadRIA, feature layers operate differently from raster layers. While raster layers rely on models to retrieve data from the internet, feature layers introduce an additional abstraction called the store. The store is responsible for providing read/write access to the data, similar to a database, and allows for operations such as querying, inserting, updating, and deleting geospatial features.

A store typically provides the following operations:

- `get`: Retrieve a feature by ID.
- `add`: Insert a new feature.
- `put`: Update an existing feature.
- `delete`: Delete an existing feature.
- `query`: Retrieve a list of features that match the query.

Stores can either store data locally, such as with `MemoryStore`, or retrieve data from a remote repository using `WFSFeatureStore`. You can also define your own custom stores to meet specific needs.

## Adding a WFS Layer

To add a WFS layer to a LuciadRIA map, you will need to use the `WFSFeatureStore`. The process involves the following steps:

1. **Create a Map**: Initialize your map instance.
2. **Create a Store**: Use a `WFSFeatureStore` to access WFS data.
3. **Create a Model**: Use a `FeatureModel` to represent the data.
4. **Assign the Model to a Layer**: Use a `FeatureLayer` to visually represent the model.
5. **Insert the Layer into the Map**: Add the layer to the map's `layerTree`.

The LuciadRIA API provides robust models and layers for accessing and displaying WFS data:

- **Store**: `WFSFeatureStore` handles access to the WFS data.
- **Model**: `FeatureModel` represents the data.
- **Layer**: `FeatureLayer` visualizes the model on the map.

For detailed documentation, refer to:

- [WFSFeatureStore Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_model_store_WFSFeatureStore.WFSFeatureStore.html)
- [FeatureModel Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_model_feature_FeatureModel.FeatureModel.html)
- [FeatureLayer Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_view_feature_FeatureLayer.FeatureLayer.html)

These resources provide specific guidance on implementing WFS layers in your LuciadRIA application.

### Method 1: Adding a WFS Layer Using the Standard Pattern

To add a WFS layer using the standard approach:

```typescript
const wfsUrl = "URL_OF_WFS_SERVICE";

// Create the store with required options
const store = new WFSFeatureStore(storeOptions);

// Create the model with the store
const model = new FeatureModel(store, modelOptions);

// Create the layer and set the desired label
const layer = new FeatureLayer(model, layerOptions);

// Insert the layer into the map
map.layerTree.addChild(layer);
```

The `WFSFeatureStore` constructor requires several parameters, which can make the process complex. To simplify model creation, the LuciadRIA API offers alternative methods that query the server for the required settings using the GetCapabilities query.

### Method 2: Using `WFSFeatureStore.createFromCapabilities`

The LuciadRIA API allows you to query the WFS server for information about layers and configurations using `WFSCapabilities`.

```typescript
// Perform: wfsUrl?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.3.0
WFSCapabilities.fromURL("http://sampleservices.luciad.com/wfs")
    .then(function(capabilities) {
        // Create a store using the capabilities
        const store = WFSFeatureStore.createFromCapabilities(capabilities, "usrivers");
        // Create a model for the store
        const model = new FeatureModel(store, modelOptions);
        // Create a layer for the model 
        const layer = new FeatureLayer(model, layerOptions);
        // Add the model to the map
        map.layerTree.addChild(layer);
    });
```

### Method 3: Using `WFSFeatureStore.createFromURL`

This method streamlines the process by automatically handling the GetCapabilities request and setting up the store. The model, and layer are setup as usual:

```typescript
WFSFeatureStore.createFromURL("http://sampleservices.luciad.com/wfs", {
    typeName: "usrivers"
}).then((store) => {
    // Create a model for the store
    const model = new FeatureModel(store, modelOptions);
    // Create a layer for the model
    const layer = new FeatureLayer(model, layerOptions);
    // Add the layer to the map
    map.layerTree.addChild(layer);
}).catch((error) => {
    console.error("Failed to create WFS layer:", error);
});
```

In this example, the `createFromURL` method automatically handles the retrieval of capabilities and configuration of the `WFSFeatureStore`. You simply need to specify the URL of the WFS service and the type name of the layer you wish to access. After the store is created, you can proceed to create a model and layer, and then add the layer to your map.

This method provides a convenient and efficient way to integrate WFS layers into your LuciadRIA applications with minimal setup.

So far we have use layerOptions only to assign a label, but there are many other properties that can be set.
For instance:
```typescript
const layer = new FeatureLayer(model, {
    label: "Name",
    editable: false,
    selectable: true,
    hoverable: true,
    ...other
});
```

You can read the documentation for `FeatureLayerConstructorOptions` to see all the available options

- [FeatureLayerConstructorOptions Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/interfaces/_luciad_ria_view_feature_FeatureLayer.FeatureLayerConstructorOptions.html)
