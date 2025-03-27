# Loading Raster data WMS



Therefore every Layer has a Model. When we want to visualize raster data, both, the model and the layer need to be capable to present the raster data.

To visualize raster daya LuciadRIA supports:
WMS, WMTS, LTS and you could even customize your own custom formats  implementing your own classes from the abstract classes available.

In this example we will focus  on WMS, but WMTS and LTS follow very similar procedures.

## What is WMS?
OGC WMS (Web Map Service) is a standard protocol developed by the Open Geospatial Consortium (OGC) for serving georeferenced map images over the internet. It allows users to request map images from a server using parameters such as geographic coordinates, image format, and layer visibility, enabling dynamic map visualization and integration into web applications.



