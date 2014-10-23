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
  layersControl.addOverlay(resultLayer, "Found");
  layersControl.addOverlay(poiLayer, "Interesting");
}
Map2D.prototype = {

  setPos : function(lat, long) {
    this.map.setView([lat, long], 10);
  },

  showPOIs : function(pois) {
    var layer = this.resultLayer;
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

    const lineOptions = {
      weight: 2,
      opacity: 0.7,
      color: "yellow",
    };
    function featureOptions(layer) {
      return {
        fillColor: "blue", // TODO result vs. poi (make style per layer)
        weight: 2,
        opacity: 0.7,
        color: "blue",
        fillOpacity: 0.5,
      };
    }
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
          featureOptions(layer));
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
        }), featureOptions(poi));*/
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
