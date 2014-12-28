/**
 * Uses Leaflet to render a map,
 * and allow the user to interact with it.
 *
 * (c) 2014 Ben Bucksch
 * License: GPL3, see LICENSE
 */

function Map2D() {
  var map = this.map = new L.map("map", {
    tap : false, // breaks page scrolling on mobile
    //dragging : gDevice.deviceType == "desktop", // ditto
    //scrollWheelZoom : false, // breaks page scrolling on mobile
  });
  map.attributionControl.setPrefix("");
  var osmLayer = new L.TileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
  });
  // NASA Blue Marble <http://mike.teczno.com/notes/blue-marble-tiles.html>
  // Need to mirror once we make serious traffic
  var satLayer = new L.TileLayer(
      "http://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg",
      {
      attribution: "Satellite view NASA and ModestMaps",
      maxZoom : 9,
  });
  // zoom level 9 is not enough, so use OSM for > 9
  var osmLayerZoom = new L.TileLayer("http://a.tile.osm.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
      minZoom : 10,
      maxZoom : 18,
  });
  new L.LayerGroup([ satLayer, osmLayerZoom ]).addTo(map);

  new L.Control.Scale().setPosition("bottomright").addTo(map);

  // Layers
  // Order matters, last one added is the one getting the mouse events
  var resultLayer = this.resultLayer = new L.FeatureGroup().addTo(map);
  var poiLayer = this.poiLayer = new L.FeatureGroup().addTo(map);
  var layersControl = new L.Control.Layers().setPosition("topleft").addTo(map);
  layersControl.addBaseLayer(osmLayer, "Map");
  layersControl.addBaseLayer(satLayer, "Sat");
  layersControl.addOverlay(poiLayer, "Interesting");
  layersControl.addOverlay(resultLayer, "Found");
}
Map2D.prototype = {

  setPos : function(lat, long) {
    this.map.setView([lat, long], 10);
  },

  /**
   * Add event listener that's called when the visible map area changes,
   * either by panning or zooming.
   * @param func {Function(latCenter, longCenter, zoomLevel,
   *      latNorth, longWest, latSouth, longEast)}
   */
  onMove : function(func) {
    var map = this.map;
    this.map.on("moveend", function(e) {
      var center = map.getCenter();
      var zoomLevel = map.getZoom();
      var bounds = map.getBounds();
      try {
        func(center.lat, center.lng, zoomLevel,
            bounds.getNorth(), bounds.getWest(),
            bounds.getSouth(), bounds.getEast());
      } catch (e) { errorNonCritical(e); }
    });
  },

  /**
   * @param pois {Array of {POI}}
   * @params params.layer {Leaflet.Layer}   which layer to add it to
   * @params params.color {String}   a CSS color
   * @params params.style {JS Obj}   style properties for dots
   * @params params.zoom {Boolean}   (default true) zoom to all POIs
   * @params params.onHighlight {Function(poi)}   on mouseover
   * @params params.onUnhighlight {Function(poi)}   on mouseleave
   * @params params.onClick {Function(poi)}   on mouse click
   */
  showPOIs : function(pois, params) {
    var layer = params.layer || this.resultLayer;
    layer.clearLayers();
    function highlightFeature(e) {
      try {
        var feature = e.target;
        var poi = feature.poi;
        if (params.onHighlight) {
          params.onHighlight(poi);
        }
      } catch (e) { params.errorCallback(e); }
    }
    function unhighlightFeature(e) {
      try {
        var feature = e.target;
        var poi = feature.poi;
        if (params.onUnhighlight) {
          params.onUnhighlight(poi);
        }
      } catch (e) { params.errorCallback(e); }
    }
    function clickFeature(e) {
      try {
        var feature = e.target;
        var poi = feature.poi;
        ddebug(poi.name + " clicked");
        if (params.onClick) {
          params.onClick(poi);
        }
      } catch (e) { params.errorCallback(e); }
    }

    var style = {
        fillColor: "blue",
        weight: 2,
        opacity: 0.7,
        color: "blue",
        fillOpacity: 0.5,
    };
    for (var p in params.style) {
      style[p] = params.style[p];
    }
    if (params.color) {
      style.color = params.color;
      style.fillColor = params.color;
    }
    if (params.solid) {
      style.opacity = 1.0;
      style.fillOpacity = 1.0;
    }
    // for touch events only
    const invisibleOptions = {
      weight: 0,
      opacity: 0,
      fillOpacity: 0,
      color: "white",
      fillColor: "white",
    };

    var totalBounds = new L.LatLngBounds();

    pois.forEach(function makeFeatureFromPOI(poi) {
      if (poi.color && poi.colorCSS) {
        //ddebug("color " + poi.colorCSS + " alpha " + poi.color.a);
        style.color = style.fillColor = poi.colorCSS;
        style.fillOpacity = poi.color.a;
      }
      var feature;
      if (poi.geoJSON) {
        feature = L.GeoJSON.geometryToLayer(poi.geoJSON);
        feature.setStyle(style);
      } else if (poi.polygon) {
        feature = new L.Polygon(poi.polygon.map(function(point) {
          return [ point.lat, point.long ];
        }), style);
      } else {
        var featureVisible = new L.CircleMarker(
            [ poi.lat, poi.long ],
            style);
        featureVisible.setRadius(5); // px
        featureVisible.addTo(layer);
        // Make click target larger, for mobile
        feature = new L.CircleMarker(
            [ poi.lat, poi.long ],
            invisibleOptions);
        feature.setRadius(10); // px
      }
      feature.bindLabel(poi.name); // needs plugin Leaflet.label
      feature.poi = poi;
      feature.addTo(layer);
      totalBounds.extend(feature.getBounds());
      feature.on({
          mouseover : highlightFeature,
          mouseout : unhighlightFeature,
          click : clickFeature,
      });
    });

    if ((params.zoom || params.zoom == undefined) &&
        totalBounds.isValid()) {
      // place and zoom map based on features shown
      this.map.fitBounds(totalBounds);
      // max zoom, but only for automatic zoom
      if (this.map.getZoom() > 14) {
        this.map.setZoom(14);
      }
    }
  },
}
