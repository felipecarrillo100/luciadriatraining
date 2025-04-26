## Styling Point Cloud Data

The `TileSet3DLayer` in LuciadRIA offers an extensive array of styling options, empowering you to customize the visual representation of your 3D data to fulfill specific aesthetic and functional needs. By tailoring these styles, you can significantly enhance the clarity, emphasis, and overall impact of your visualizations.

To apply a custom style to your point cloud data, you can set the `pointCloudStyle` property of the `TileSet3DLayer`:

```typescript
layer.pointCloudStyle = YOUR_CUSTOM_STYLE;
```

For comprehensive details on defining and applying these styles, please refer to the [PointCloudStyle interface documentation](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/reference/LuciadRIA/interfaces/_luciad_ria_view_style_PointCloudStyle.PointCloudStyle.html). Additionally, you can explore the [guide on styling and filtering point clouds](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/howto/ogc3dtiles/styling_filtering_point_clouds.html?subcategory=ria_hspc) for more practical insights.

These resources provide detailed guidance on various visual parameters you can adjust, such as color, transparency, and other visual effects.



### Expressions

In LuciadRIA, an expression typically refers to a typed value expression used in styling, filtering. An expression evaluates arithmetic or boolean operations of values. These expressions are written in a domain-specific expression language provided by LuciadRIA and are commonly used in FeatureLayer styling, and filtering logic.

You could for instance, create an expression to paint a mesh or a point Cloud on based on the value of a parameter.

Here some examples:

- Paint a point cloud or a mesh based on it's distanmce from the center of the earth
- Hide a point cloud or a mesh if it is outside/inside a bbox
- Paint a point cloud based on the value of a property.

In the next example using visibilityExpression all points located with in a minimum and maximum height are painted:
```Typescript
import {
    color,
    distance, fraction, mixmap,
    numberParameter, ParameterExpression,
    pointParameter,
    positionAttribute
} from "@luciad/ria/util/expression/ExpressionFactory.js";

const COLOR_SPAN_HEIGHT= [
    "#000080", 
    "#00BFFF", 
    "#00FF00", 
    "#ADFF2F", 
    "#FFFF00", 
    "#FFA500", 
    "#FF0000", 
];

const minParameter = numberParameter(65000);
const maxParameter = numberParameter(65100);

const position = positionAttribute();
const earthCenter = pointParameter({x: 0, y: 0, z: 0});

// Distance to the center of the earth in meters
const distanceToCenter = distance(position, earthCenter);

// Returns a value 0, 1 
const heightFraction = fraction(distanceToCenter, minParameter, maxParameter);

// Create an array of color as Expressions
const colorMix = COLOR_SPAN_HEIGHT.map(c => {
    return color(c);
});

const pointCloudStyle = {
    // A color interpolating the color on the gradient colorMix where colorMix in an array of color expressions
    // heightFraction: from 0 to 1, 0 is the color[0], 1 is color[n], any value in between the color is interpolated in the gradient
    colorExpression: mixmap(heightFraction, colorMix)
};
```

NOTE: Expressions are evaluated on the GPU, making them much faster, but also harder to debug. Therefore, we recommend carefully implementing and reviewing your expressions.


