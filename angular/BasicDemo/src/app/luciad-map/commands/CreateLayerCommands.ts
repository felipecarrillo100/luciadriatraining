export const WMS_LayerGroup = {
  "action": "CreateAnyLayer",
  "parameters": {
    "layerType": "LayerGroup",
    "layer": {
      "label": "WMS Layers",
      "visible": true,
      "id": "WMS-LAYERS-ID"
    }
  }
}
export const WMS_HAMBURG_RGB = {
  "action": "CreateAnyLayer",
    "parameters": {
    "fitBounds": {
      "reference": "EPSG:4326",
        "coordinates": [
        8.48205,
        1.8735500000000016,
        53.3856,
        0.555800000000005
      ]
    },
    "layerType": "WMSLayer",
      "model": {
      "getMapRoot": "https://geodienste.hamburg.de/HH_WMS_DOP",
        "layers": [
        "DOP"
      ],
        "referenceText": "EPSG:3857",
        "transparent": true,
        "version": "1.3.0",
        "imageFormat": "image/png"
    },
    "layer": {
      "label": "Digitale Orthophotos Hamburg (RGB)",
      "visible": false
    },
      parentId: "WMS-LAYERS-ID",
      "autoZoom": true
  }
}


export const WMS_PEGEOnline = {
  "action": "CreateAnyLayer",
  "parameters": {
    "fitBounds": {
      "reference": "CRS:84",
      "coordinates": [
        5.089750059592558,
        10.814845097296391,
        46.981496646073595,
        8.17185543149818
      ]
    },
    "layerType": "WMSLayer",
    "model": {
      "getMapRoot": "https://www.pegelonline.wsv.de/webservices/gis/wms",
      "layers": [
        "PegelonlineWMS"
      ],
      "referenceText": "EPSG:3857",
      "transparent": true,
      "version": "1.3.0",
      "imageFormat": "image/png",
      "infoFormat": "text/html",
      "queryable": true
    },
    "layer": {
      "label": "PEGELONLINE (MNW/MHW)",
      "visible": false,
      "queryable": true,
      "getFeatureInfoFormat": "application/json"
    },
    parentId: "WMS-LAYERS-ID",
    "autoZoom": true
  }
}


export const WMS_Wasserstrassenklassen = {
  "action": "CreateAnyLayer",
  "parameters": {
    "fitBounds": {
      "reference": "EPSG:4326",
        "coordinates": [
        5,
        10,
        47,
        9
      ]
    },
    "layerType": "WMSLayer",
      "model": {
      "getMapRoot": "https://via.bund.de/wsv/bwastr/wms",
        "layers": [
        "Wasserstrassenklassen"
      ],
        "referenceText": "EPSG:3857",
        "transparent": true,
        "version": "1.3.0",
        "imageFormat": "image/png",
        "infoFormat": "text/html",
        "queryable": true
    },
    "layer": {
      "label": "Wasserstraßenklassen",
      "visible": false,
      "queryable": true,
      "getFeatureInfoFormat": "application/json"
    },
    parentId: "WMS-LAYERS-ID",
    "autoZoom": true
  }
}
export const Bundeswasserstraßen = {
  "action": "CreateAnyLayer",
    "parameters": {
    "fitBounds": {
      "reference": "EPSG:4326",
        "coordinates": [
        5,
        10,
        47,
        9
      ]
    },
    "layerType": "WMSLayer",
      "model": {
      "getMapRoot": "https://via.bund.de/wsv/bwastr/wms",
        "layers": [
        "WmsBWaStr"
      ],
        "referenceText": "EPSG:3857",
        "transparent": true,
        "version": "1.3.0",
        "imageFormat": "image/png",
        "infoFormat": "text/html",
        "queryable": true
    },
    "layer": {
      "label": "Bundeswasserstraßen",
      "visible": false,
      "queryable": true,
      "getFeatureInfoFormat": "application/json"
    },
      parentId: "WMS-LAYERS-ID",
      "autoZoom": true
  }
}

export const BINGMAPS_AERIAL = {
  "action": "CreateAnyLayer",
  "parameters": {
    "layerType": "BingmapsLayer",
    "autoZoom": false,
    "model": {
      "imagerySet": "Aerial",
      "useproxy": false,
      "token": "AugjqbGwtwHP0n0fUtpZqptdgkixBt5NXpfSzxb7q-6ATmbk-Vs4QnqiW6fhaV-i"
    },
    "layer": {
      "label": "Aerial"
    }
  }
}
