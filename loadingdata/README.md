## Adding Layers to LuciadRIA

The process of adding data to a LuciadRIA map follows a consistent pattern.

To begin, a map is created with the following code:

```typescript
const map = new WebGLMap(divElement, { reference: getReference("EPSG:4978") });
```

Once the map is created, you can add new layers using:

```typescript
map.layerTree.addChild(newLayer);
```

**Note:** The `addChild` method, by default, inserts layers at the top of the layer stack. However, you can specify additional parameters to position the layer differently, such as:

```typescript
nativeMap.layerTree.addChild(layer, "bottom");
```

A layer serves as a visual representation of data, but it does not inherently contain the data itself. Instead, a layer is linked to a model. The model manages or provides access to data, which can be stored locally in memory or accessed remotely over the internet.

The general pattern for adding a layer is as follows:

```typescript
// Create a model
const model = new SomeModel(modelOptions);

// Create a layer
const layer = new SomeLayer(model, layerOptions);

// Add the layer to the map
map.layerTree.addChild(layer);
```

This approach ensures that your data is effectively visualized and managed within the LuciadRIA framework.
