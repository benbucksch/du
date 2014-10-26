
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
  var query = "SELECT * FROM <http://dbpedia.org> WHERE { " +
    "?poi dbpprop:name ?name . " +
    "?poi geo:lat ?lat . " +
    "?poi geo:long ?lon . " +
    "?poi geo:geometry ?geo . " +
    "FILTER (bif:st_intersects (?geo, bif:st_point (" + long + ", " + lat + "), " + radius + ")) " +
  "} LIMIT 100"
  du.sparqlSelect(query, {}, function(rs) {
    //alert(dumpObject(rs, "rs", 3));
    var results = rs.map(function(r) {
      return new POI(r.name, r.lat, r.lon, null, r.poi);
    });
    resultCallback(results);
  }, errorCallback);
}

function osmPOIs(lat, long, radius, resultCallback, errorCallback) {
  var query = "SELECT * FROM <http://linkedgeodata.org> WHERE { " +
    "?poi rdfs:label ?name . " +
    "?poi geo:lat ?lat . " +
    "?poi geo:long ?lon . " +
    "?poi geo:geometry ?geo . " +
    "FILTER (bif:st_intersects (?geo, bif:st_point (" + long + ", " + lat + "), " + radius + ")) " +
  "} LIMIT 100"
  du.sparqlSelect(query, {}, function(rs) {
    //alert(dumpObject(rs, "rs", 3));
    var results = rs.map(function(r) {
      return new POI(r.name, r.lat, r.lon, null, r.poi);
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
      resultCallback(results.slice(0, 1)); // return first result only
      //resultCallback(results);
    } catch (e) { errorCallback(e); }
  }, function(e) { errorCallback(e); });
}
