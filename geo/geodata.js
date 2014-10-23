
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
* Find interesting points around the position,
* using dbpedia
* @param radius {Integer} in km
*/
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
