/**
 * Uses Leaflet to render a map,
 * and allow the user to interact with it.
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
   * @param pois {Array of {POI}}
   * @params params.layer {Leaflet.Layer}   which layer to add it to
   * @params params.color {String}   a CSS color
   * @params params.style {JS Obj}   style properties for dots
   */
  showPOIs : function(pois, params) {
    var layer = params.layer || this.resultLayer;
    layer.clearLayers();
    function highlightFeature(e) {
      try {
        var feature = e.target;
        updateInfobox(feature.poi);
      } catch (e) { p.errorCallback(e); }
    }
    function unhighlightFeature(e) {
      try {
        var feature = e.target;
        updateInfobox(feature.poi);
      } catch (e) { p.errorCallback(e); }
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

    function makeFeatureFromPOI(poi) {
      var feature;
      //if (place.point) {
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
      /*} else if (place.area) {
        feature = new L.Polygon(place.area.map(function(point) {
          return [ point.lat, point.long ];
        }), style);*/
      feature.bindLabel(poi.name); // needs plugin Leaflet.label
      feature.poi = poi;
      feature.addTo(layer);
      totalBounds.extend(feature.getBounds());
      feature.on({
          mouseover : highlightFeature,
          mouseout : unhighlightFeature,
          click : highlightFeature,
      });
    }

    pois.forEach(makeFeatureFromPOI);

    // place and zoom map based on features shown
    this.map.fitBounds(totalBounds);
    // max zoom, but only for automatic zoom
    if (this.map.getZoom() > 14) {
      this.map.setZoom(14);
    }
  }
}


function updateInfobox(poi) {
  // TODO
}
