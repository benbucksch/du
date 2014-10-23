/**
 * TODO implement fallback for non-WebGL browsers,
 * using leafletjs, and do not load WebGLEarth in this case.
 */

var du = window.parent;
var gMap;

function onLoad() {
  E("search-button").addEventListener("click", onSearch, false);
  E("search-field").addEventListener("keypress", function(event) {
    if (event.keyCode == 13) {
      onSearch();
    }
  }, false);

  var params = parseURLQueryString(window.location.hash);
  var lat = params.lat || 51.330;
  var long = params.lon || 10.453;

  var map = gMap = new Map2D();
  map.setPos(lat, long);

  dbpediaPOIs(lat, long, 5, function(pois) {
    map.showPOIs(pois);
  }, errorNonCritical);
}
window.addEventListener("load", onLoad, false);

function onSearch(event) {
  var errorCallback = function(e) {
    // TODO show inline underneath search field
    errorCritical(e);
  };
  var resultCallback = function(places) {
    gMap.showPOIs(places);
  };
  var address = E("search-field").value;
  if ( !address) {
    errorCallback(new Exception("Nothing entered"));
    return;
  }
  searchAddress(address, resultCallback, errorCallback);
}


function render(time) {
  requestAnimationFrame(render);
  TWEEN.update(time);
}
