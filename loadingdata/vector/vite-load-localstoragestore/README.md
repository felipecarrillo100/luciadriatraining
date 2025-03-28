## Editing a Store

In previous exercises, we have worked with read-only FeatureLayers. However, it's often necessary to edit a feature layer by adding new features, deleting existing ones, or updating current features.

To enable these operations, we need a store that supports write operations such as `add`, `put`, and `remove`. 

The `MemoryStore` is an excellent example of such a store. You can find more information at

[MemoryStore Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_model_store_MemoryStore.MemoryStore.html).

Additionally, we need a `Controller` capable of editing the features we wish to modify.

## Controllers

The LuciadRIA architecture follows the Model-View-Controller (MVC) pattern:

- **Model**: Manages data access and business logic.
- **View**: Displays data to the user and sends user commands to the controller. In LuciadRIA, the view consists of the Map and Layers.
- **Controller**: Acts as an intermediary, processing user input and updating the model and view accordingly, coordinating actions between them.

All LuciadRIA maps have a controller. If no specific controller is assigned, the map defaults to the standard controller.

### Introduction to Editing Controllers

Controllers can be specialized for specific tasks, such as measuring distances or editing features.

All controllers must extend from the `Controller` class or any of its subclasses. More details can be found at the [Controller Documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_view_controller_Controller.Controller.html).

Many Controller are already available in the API. And of course, you can also create custom controllers to implement specific functionalities.

Among the Controllers available in the API we can find the Edit-Controllers. Edit controllers allows us to create or edit features, which are then stored in the model's store and displayed as a layer.

LuciadRIA provides two controllers for editing:

- `BasicCreateController`: Allows you to create new features.
- `EditController`: Allows the creation of new features.

In this example, we will create our own controller by extending `BasicCreateController`.

### Creating a Custom Controller

To develop this custom controller, extend the `BasicCreateController`, which already handles most of the necessary functionality. You only need to add specific customizations.

```typescript
// Extend from a Controller class
class CreateFeatureInLayerController extends BasicCreateController {
    // Define a new constructor
    constructor(shapeType: ShapeType, defaultProperties?: FeatureProperties, options?: CreateFeatureInLayerControllerOptions) {
        // Call the parent class constructor
        super(shapeType, defaultProperties, options as CreateControllerConstructorOptions);
        // Add your initialization code here
        ...
    }
    
    // Implement or overwrite any methods required
    ...
}
```

To assign a controller to a Map, simply set your new controller as the map's controller:

```typescript
map.controller = new CreateFeatureInLayerController(...any parameters needed...);
```

This Controller will allow us to create a new Feature, and once the feature is created the control of the map goes back to the default controller.


## Events

This example requires an understanding of the concept of events.

An event is an occurrence or action that takes place within an application, prompting the execution of a specific task whenever the event occurs. Events utilize a Subscribe/Notify pattern, where listeners are registered (subscribed) to events and are triggered (notified) to perform actions when these events happen.

LuciadRIA supports a variety of events. For instance, the LuciadRIA Map includes:

- **MapChange**: Triggered when the visible area of the map changes.
- **SelectionChange**: Activated when the selection of features or other selectable items on the map changes.
- **ControllerChange**: Occurs when a new controller is assigned to the map.

There are many more events available. For a comprehensive list, please refer to the [LuciadRIA documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/classes/_luciad_ria_view_WebGLMap.WebGLMap.html).

In this example, we will assign the `EditController` whenever a single individual feature is selected.

Here is how it can be implemented:

```typescript
// This code will be called every time the selection change in the map
map.on("SelectionChanged", () => {
  const selection = map.selectedObjects;
  // Verify only one layer / one feature is selected
  if (selection.length === 1 && selection[0].layer === layer) {
    if (selection[0].selected.length === 1) {
      const feature = selection[0].selected[0];
      // Set the Edit controller to edit the selected feature
      const editController = new EditController(layer, feature, {
        finishOnSingleClick: true
      });
      map.controller = editController;
    }
  }
});
```

This code snippet listens for the "SelectionChanged" event and assigns an `EditController` when exactly one feature is selected on the specified layer.
