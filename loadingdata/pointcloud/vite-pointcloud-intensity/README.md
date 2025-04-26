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

In the next example using colorExpression we will color the point clouds according to the property "Intensity"

```Typescript
import {
    attribute,
    color,
    fraction,
    mixmap,
    numberParameter,
    ParameterExpression,
} from "@luciad/ria/util/expression/ExpressionFactory.js";

const COLOR_SPAN_INTENSITY = [
    "#001F3F",
    "#0074D9",
    "#7FDBFF",
    "#B3E5FC",
    "#E0F7FA"
];

// Range (8 bits)
const minParameter = numberParameter(0);
const maxParameter = numberParameter(256);

// Coloring on attribute("Intensity")
const intensityFraction = fraction(attribute("Intensity"), minParameter!, maxParameter!);

// Create Color Map as an array of color Expressions
const colorMix = COLOR_SPAN_INTENSITY.map(c => {
    return color(c);
});
const pointCloudStyle = {
    // A color interpolating the color on the gradient colorMix where colorMix in an array of color expressions
    // heightFraction: from 0 to 1, 0 is the color[0], 1 is color[n], any value in between the color is interpolated in the gradient
    colorExpression: mixmap(intensityFraction, colorMix)
};
```

NOTE: Expressions are evaluated on the GPU, making them much faster, but also harder to debug. Therefore, we recommend carefully implementing and reviewing your expressions.


