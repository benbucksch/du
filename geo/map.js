/**
 * Uses webglearth.org to render a map and globe,
 * and allow the user to interact with it.
 *
 * TODO implement fallback for non-WebGL browsers,
 * using leafletjs, and do not load WebGLEarth in this case.
 */

function onLoad() {
  var params = parseURLQueryString(window.location.search);
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

  var cartographic = Cesium.Cartographic.fromDegrees(lon, lat);
  var cartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
  scene.camera.setPositionCartographic(cartesian);

  /*var west = Cesium.Math.toRadians(lat - 1);
  var south = Cesium.Math.toRadians(lon - 1);
  var east = Cesium.Math.toRadians(lat + 2);
  var north = Cesium.Math.toRadians(lon + 1);
  var extent = new Cesium.Extent(west, south, east, north);
  scene.camera.viewExtent(extent, Cesium.Ellipsoid.WGS84);*/

  /*var zoom = 8;
  var flight = Cesium.CameraFlightPath.createTween(scene, {
    destination : Cesium.Cartographic.fromDegrees(lat, lon, zoom),
    duration: 1000,
  });
  scene.animations.add(flight);*/
/*
  render();
  var zoomTween = new TWEEN.Tween({ zoom: map.getZoom() })
              .to({ zoom: 10.0 }, 2000)
              .onUpdate(function() {
                map.setZoom(this.zoom);
              })
              .easing(TWEEN.Easing.Quadratic.InOut)
              .start();
*/
}
window.addEventListener("load", onLoad, false);


function render(time) {
  requestAnimationFrame(render);
  TWEEN.update(time);
}
