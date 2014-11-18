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

  var map = gMap = new Map2D();

  var params = parseURLQueryString(window.location.hash);
  var lat = params.lat || 51.330;
  var long = params.lon || 10.453;
  map.setPos(lat, long);
  if (params.address) {
    E("search-field").value = params.address;
    onSearch();
  }
}
window.addEventListener("load", onLoad, false);

function onSearch(event) {
  var errorCallback = function(e) {
    // TODO show inline underneath search field
    errorCritical(e);
  };
  var resultCallback = function(places) {
    // Show results
    gMap.showPOIs(places, {
        color: "blue",
        solid: true,
        layer: gMap.resultLayer,
        onHighlight : updateInfoboxPOI,
        onClick : clickPOI,
        errorCallback : errorCritical,
    });

    // Show POIs around this point
    var p = places[0];
    if (p) {
      osmPOIs(p.lat, p.long, 2, function(pois) {
        //arrayRemove(pois, p);
        gMap.showPOIs(pois, {
            color: "green",
            layer: gMap.poiLayer,
            onHighlight : updateInfoboxPOI,
            onClick : clickPOI,
            errorCallback : errorCritical,
        });
      }, errorNonCritical);

      /*
      osmXML(p.lat - 0.1, p.long - 0.1, p.lat + 0.1, p.long + 0.1, function(result) {
        gMap.showPOIs(result.nodes, {
            color: "yellow",
            layer: gMap.poiLayer,
        });
      }, errorNonCritical);
      */
    }
  };
  var address = E("search-field").value;
  if ( !address) {
    errorCallback(new Exception("Nothing entered"));
    return;
  }
  searchAddress(address, resultCallback, errorCallback);
}

function updateInfoboxPOI(poi) {
  // TODO show infobox
  enhancePOI(poi, function() {
  }, errorNonCritical);
}

function clickPOI(poi) {
  var url = poi.appURL || poi.url;
  if (url) {
    window.open(url);
    return;
  }
}
