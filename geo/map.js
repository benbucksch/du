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

  // Init WebGLEarth
  var map = new WE.map("map", {
    zoom: 8.0,
    position: [ lat, lon ],
    sky: true,
    atmosphere: true,
  });
  WE.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution: "&copy; <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
  }).addTo(map);
  /*
  // NASA Blue Marble <http://mike.teczno.com/notes/blue-marble-tiles.html>
  // Need to mirror once we make serious traffic
  var satLayer = WE.tileLayer("http://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg",{
    attribution: "Satellite view NASA and ModestMaps",
    maxZoom : 9,
  });
  // zoom level 9 is not enough, so use OSM for > 9
  var osmLayerZoom = WE.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution: "&copy; <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
    minZoom : 10,
    maxZoom : 18,
  });
  WE.LayerGroup([ satLayer, osmLayerZoom ]).addTo(map);
  */

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
