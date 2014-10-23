/**
 * Uses webglearth.org to render a map and globe,
 * and allow the user to interact with it.
 *
 * TODO implement fallback for non-WebGL browsers,
 * using leafletjs, and do not load WebGLEarth in this case.
 */

var du = window.parent;
var gScene;

function onLoad() {
  var params = parseURLQueryString(window.location.hash);
  var lat = params.lat || 51.330;
  var lon = params.lon || 10.453;

  // Init Cesium
  /*var terrainProvider = new Cesium.CesiumTerrainProvider({
    url: "//cesiumjs.org/stk-terrain/tilesets/world/tiles",
    requestVertexNormals: true,
  });*/
  /*var terrainProvider = new Cesium.CesiumTerrainProvider({
    url: "//cesiumjs.org/tilesets/terrain/smallterrain",
  });*/

  var satProvider = new Cesium.ArcGisMapServerImageryProvider({
    url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
  });
  /*var satProvider = new Cesium.TileMapServiceImageryProvider({
    url: "../lib/Cesium/Assets/Textures/NaturalEarthII",
    fileExtension: "jpg",
  });*/

  var viewer = new Cesium.Viewer("map", {
    infoBox: false,
    timeline: false,
    navigationHelpButton: false,
    homeButton: false,
    fullscreenButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    animation: false,
    baseLayerPicker: false,
    imageryProvider: satProvider,
    //terrainProvider: terrainProvider,
    targetFrameRate: 25,
    creditCdontainer: "credits",
  });
  var scene = viewer.scene;
  gScene = scene;

  /*var streetLayer = viewer.scene.imageryLayers.addImageryProvider(
    new Cesium.ArcGisMapServerImageryProvider({
      url: "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer",
    }));*/
  var placeLayer = viewer.scene.imageryLayers.addImageryProvider(
    new Cesium.ArcGisMapServerImageryProvider({
      url: "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
    }));

  /*
  // NASA Blue Marble <http://mike.teczno.com/notes/blue-marble-tiles.html>
  // Need to mirror once we make serious traffic
  var satLayer = WE.tileLayer("http://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg",{
    attribution: "Satellite view NASA and ModestMaps",
    maxZoom : 9,
  });
  // zoom level 9 is not enough, so use OSM for > 9
  var osmLayerZoom = WE.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution: "© <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
    minZoom : 10,
    maxZoom : 18,
  });
  */

  scene.camera.setPositionCartographic(
    Cesium.Cartographic.fromDegrees(lon, lat, 500000)); // height in m

  /*scene.camera.flyTo({
    destination: Cesium.Cartographic.fromDegrees(lon, lat, 500000),
    duration: 1, // in s
  });*/

  /*
  render();
  var zoomTween = new TWEEN.Tween({ zoom: map.getZoom() })
              .to({ height: 500000 }, 10000)
              .onUpdate(function() {
                scene.camera.setPositionCartographic(
                  Cesium.Cartographic.fromDegrees(lon, lat, this.height));
              })
              .easing(TWEEN.Easing.Quadratic.InOut)
              .start();
  */

  dbpediaPOIs(lat, lon, 5, showPOIs, errorNonCritical);

  E("search-field").addEventListener("submit", onSearch, false);
  E("search-button").addEventListener("click", onSearch, false);
}
window.addEventListener("load", onLoad, false);

/**
 * Shows a marker on the map
 * @param name {string} to be disabled to user
 * @param lat {float}
 * @param long {float}
 * @param icon {URL as string}
 */
function POI(name, lat, long, icon, id) {
  ddebug("POI " + name);
  this.name = name;
  this.lat = lat;
  this.long = long;
  this.icon = icon;
  this.id = id; // optional
}
POI.prototype = {
}

/**
 * Show interesting points around the position.
 *
 * @param radius {Integer} in km
 */
function showPOIs(pois) {
    var labels = new Cesium.LabelCollection();
    gScene.primitives.add(labels);
    pois.forEach(function(poi) {
      labels.add({
        position: Cesium.Cartesian3.fromDegrees(poi.long, poi.lat),
        text : poi.name,
        poi : poi,
      });
    });
}

function onSearch(event) {
  var errorCallback = function(e) {
    // TODO show inline underneath search field
    errorCritical(e);
  };
  var resultCallback = function(places) {
    showPOIs(places);
  };
  var address = E("search-field").value;
  if ( !address) {
    errorCallback(new Exception("Nothing entered"));
    return;
  }
  searchAddress(address, resultCallback, errorCallback);
}

/**
 * @param address {string} a free-form street address
 * @param resultCallback {Function(Array of {POI})}
 */
function searchAddress(address, resultCallback, errorCallback) {
  loadURL({
    url : "http://www.manyone.zone/geo/address",
    urlArgs : {
      q : address,
      format : "json",
    },
    dataType : "json",
  }, function(json) {
    try {
      if (json.length == 0) {
        errorCallback(new Exception("Nothing found"));
        return;
      }
      var results = [];
      json.forEach(function(place) {
        results.push(new POI(
            place.display_name,
            place.lat, place.lon,
            place.icon,
            place.place_id));
      });
      resultCallback(results);
    } catch (e) { errorCallback(e); }
  }, function(e) { errorCallback(e); });
}

function dbpediaPOIs(lat, long, radius, resultCallback, errorCallback) {
  var query = "SELECT ?poi ?name ?lat ?lon WHERE {" +
    "?poi dbpprop:name ?name ." +
    "?poi geo:lat ?lat ." +
    "?poi geo:long ?lon ." +
    "?poi geo:geometry ?geo ." +
    "FILTER (bif:st_intersects (?geo, bif:st_point (" + long + ", " + lat + "), " + radius + "))" +
  "} LIMIT 100"
  du.sparqlSelect(query, {}, function(r) {
    //alert(dumpObject(results, "r", 3));
    var results = [];
    results.forEach(function(r) {
      results.push(new POI(r.name, r.lat, r.lon, null, r.poi));
    });
    resultCallback(results);
  }, errorCallback);
}


function render(time) {
  requestAnimationFrame(render);
  TWEEN.update(time);
}
