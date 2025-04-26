## Styling Mesh Data

The `TileSet3DLayer` in LuciadRIA offers a comprehensive suite of styling options, allowing you to customize the visual presentation of your 3D data to meet specific aesthetic and functional needs. By adjusting these styles, you can enhance the clarity, emphasis, and overall impact of your visualizations.

To apply a custom style to your mesh data, you can configure the `meshStyle` property of the `TileSet3DLayer` as follows:

```typescript
layer.meshStyle = YOUR_CUSTOM_STYLE;
```

For detailed instructions on defining and applying these styles, please refer to the [MeshStyle interface documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/interfaces/_luciad_ria_view_style_MeshStyle.MeshStyle.html). Additionally, you can explore this [article on styling mesh data](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/howto/ogc3dtiles/styling_mesh_data.html?subcategory=ria_ogc3dtiles) for more insights.

These resources provide in-depth guidance on various visual parameters you can adjust, such as color, transparency, and other visual effects.

By leveraging these styling capabilities, LuciadRIA empowers developers to create immersive and interactive 3D visualizations. These visualizations are ideal for a wide range of applications, from detailed urban planning models to dynamic virtual simulations, enhancing both user experience and the practical utility of the data presented.


### Expressions

In LuciadRIA, an expression typically refers to a typed value expression used in styling, filtering. An expression evaluates arithmetic or boolean operations of values. These expressions are written in a domain-specific expression language provided by LuciadRIA and are commonly used in FeatureLayer styling, and filtering logic.

You could for instance, create an expression to paint a mesh or a point Cloud on based on the value of a parameter.

Here some examples:

- Paint a point cloud or a mesh based on it's distanmce from the center of the earth
- Hide a point cloud or a mesh if it is outside/inside a bbox
- Paint a point cloud based on the value of a property.

### Visibility (Filter) on `attribute(<attribute-name>)`

In the next example, we will style the mesh using visibilityExpression.
Meshes with a feature ID in a minimum and maximum value are visible while meshes out of the range are invisible.

The value of the id is retrieved with `attribute("FeatureID")`.

```Typescript
import * as ExpressionFactory from "@luciad/ria/util/expression/ExpressionFactory.js";
import{
    distance,
    numberParameter, ParameterExpression,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";

// The Feature id in this dataset are between 0 and 6000 
const minParameter = numberParameter(0);
const maxParameter = numberParameter(6000);

// Retrieve the property value with the function "attribute()" passing the property name 
const propertyValue = attribute("FeatureID");

const meshStyle = {
    // Returns true if point between min and max, 
    // point is visible onlye when the expression returns true
    visibilityExpression: ExpressionFactory.and(
        ExpressionFactory.lt(minParameter, propertyValue),
        ExpressionFactory.gt(maxParameter, propertyValue)
    )
};
```

NOTE: Expressions are evaluated on the GPU, making them much faster, but also harder to debug. Therefore, we recommend carefully implementing and reviewing your expressions.

