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
}
window.addEventListener("load", onLoad, false);


function render(time) {
  requestAnimationFrame(render);
  TWEEN.update(time);
}
