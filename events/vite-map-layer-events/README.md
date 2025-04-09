
## Events in LuciadRIA

LuciadRIA utilizes a robust event-driven architecture, allowing developers to respond to various events and triggers within the application. By listening to these events, you can execute specific actions in response to changes or interactions.

For example, if the map bounds change, you can trigger a recalculation process. Similarly, when a layer is added to or removed from the map, you can initiate subsequent actions or events.

Nearly all components in LuciadRIA support event handling. Detailed information about the available events for each component can be found in the LuciadRIA documentation.

For instance, the LuciadRIA Map component offers the following events:

- **WebGLContextChanged**
- **ReferenceChanged**
- **PostRender**
- **idle**
- **SelectionChanged**
- **HoverChanged**
- **MapChange**
- **ShowBalloon**
- **HideBalloon**
- **ControllerChanged**
- **DefaultControllerChanged**
- **DisplayScaleChanged**
- **AutoAdjustDisplayScaleChanged**

### Example: Listening to Map Events

To listen for map boundary changes (MapChange), you can set up a listener as follows:

```typescript
map.on("MapChange", () => {
    const boundsArray = map.getMapBounds();
    boundsArray.forEach(bounds => console.log(`Bounds: [x: ${bounds.x}, w: ${bounds.width}, y: ${bounds.y}, h: ${bounds.height}]`));
});
```

### Example: Layer Tree Events

A common use case is to track when layers are added, removed, or moved within the map's layer tree. This capability allows you to implement a custom layer controller effectively:

```typescript
map.layerTree.on("NodeAdded", layerTreeHasChanged);
map.layerTree.on("NodeRemoved", layerTreeHasChanged);
map.layerTree.on("NodeMoved", layerTreeHasChanged);
```

In this example, we will implement a very basic layer control mechanism, demonstrating how to leverage LuciadRIA's event system for enhanced application functionality.
