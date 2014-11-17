
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
  this.lat = parseFloat(lat);
  this.long = parseFloat(long);
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
    "?poi dbpediaprop:name ?name . " +
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
  "} LIMIT 1000"
  du.sparqlSelect(query, {}, function(rs) {
    //alert(dumpObject(rs, "rs", 3));
    var results = rs.map(function(r) {
      return new POI(r.name, r.lat, r.lon, null, r.poi);
    });
    resultCallback(results);
  }, errorCallback);
}

function osmXML(lat, long, latB, longB, resultCallback, errorCallback) {
  loadURL({
    url: "http://api06.dev.openstreetmap.org/api/0.6/map",
    urlArgs: {
      bbox: long + "," + lat + "," + longB + "," + latB,
    },
    dataType: "xml",
    username: "xxx",
    password: "xxx",
  }, function(xmlDOM) {
    resultCallback(parseOSMXML(xmlDOM));
  }, errorCallback);
}

/**
 * returns {
 *   nodes {Array of POI} with additional .tags
 *   ways {Array of way {
 *     nodes {Array of POIs},
 *     tags {Map of name {String} -> value {String}}
 *   }
 * }
 */
function parseOSMXML(xmlDOM) {
  var osm = JXON.build(xmlDOM).osm;
  var nodeByID = {};
  var standaloneNodes = [];
  var ways = [];
  function parseTags(e) {
    if ( !e.$tag) return {};
    var tags = {};
    e.$tag.forEach(function(tag) {
      tags[tag["@k"]] = tag["@v"];
    });
    return tags;
  }
  //<node> -> POI
  osm.$node.forEach(function(node) {
    var poi = new POI(null, node["@lat"], node["@lon"], null, node["@id"]);
    poi.tags = parseTags(node);
    poi.name = poi.tags.name;
    nodeByID[poi.id] = poi;
    standaloneNodes.push(poi);
  });
  //<way> -> ways with Array of POI
  osm.$way.forEach(function(way) {
    ways.push({
      nodes : way.$nd.map(function(nd) {
        var node = nodeByID[nd["@ref"]];
        arrayRemove(standaloneNodes, node);
        return node;
      }),
      tags : parseTags(way),
    });
  });
  alert(dumpObject(standaloneNodes, "node", 2) + dumpObject(ways, "way", 2));
  return { nodes : standaloneNodes, ways : ways };
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
        errorCallback(new NoResult());
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
