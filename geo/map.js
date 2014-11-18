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

/**
 * Shows a panel describing the current POI:
 * Mövenpick [bold title]
 * Hotel, TourismThing
 * Mövenpick is a large hotel chain originating in ....
 * having 456 hotels around the world.
 * More information [blue link]
 */
function updateInfoboxPOI(poi) {
  showPanelPOI(poi);
  if (poi.types.length == 0) {
    enhancePOI(poi, function() {
      showPanelPOI(poi);
    }, errorNonCritical);
  }
}


var gLastPOIPanel;

function showPanelPOI(poi) {
  if (gLastPOIPanel) {
    gLastPOIPanel.close();
  }
  var poiE = cE("div", "poi");
  var typesE = cE("div", "types");
  typesE.appendChild(cTN(poi.types.join(", "))); // TODO translate
  if (poi.description) {
    var descrE = cE("div", "description");
    descrE.appendChild(cTN(poi.description.substr(0, 240)));
    poiE.appendChild(descrE);
  }
  var url = poi.appURL || poi.url;
  if (url) {
    var linkE = cE("a", "link");
    linkE.appendChild(cTN("More information")); // TODO translate
    linkE.setAttribute("href", url)
    linkE.setAttribute("target", "_blank");
    poiE.appendChild(linkE);
  }
  gLastPOIPanel = showPanel(poiE, poi.name);
}


function clickPOI(poi) {
  var url = poi.appURL || poi.url;
  if (url) {
    window.open(url);
    return;
  }
}

/**
 * @param panelE {<div>}  The panel contents to show.
 *      No frame, border or anything.
+ *      E.g. a list of layers
 * @return { close() {Function} }
 */
function showPanel(panelE, title) {
  var parentE = document.querySelector("div.leaflet-top.leaflet-left");
  assert(parentE, "Leaflet control panel not found");
  var controlE = cE("div", "leaflet-control");
  controlE.classList.add("leaflet-bar");
  controlE.classList.add("control-panel");
  var titleE = cE("h1");
  titleE.appendChild(cTN(title));
  controlE.appendChild(titleE);
  controlE.appendChild(panelE);
  parentE.appendChild(controlE);
  return {
    close: function() {
      removeElement(controlE);
    },
  };
}
