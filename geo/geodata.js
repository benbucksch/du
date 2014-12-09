
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
  this.types = []; // optional
}
POI.prototype = {
}

function Area(name, id) {
  ddebug("Area " + name);
  this.name = name;
  this.id = id; // optional
  this.polygon = [];
  this.geoJSON = null;
}
Area.prototype = {
  /**
   * { Array of {lat {float}, long {float}}}
   */
  polygon : null,
  addPoint : function(lat, long) {
    this.polygon.push({ lat: parseFloat(lat), long: parseFloat(long) });
  },
  finished : function() {
  },
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

/**
 * Reverse Geocoding
 * For a given geographical location or area, finds the
 * most fitting place name, e.g. adminstrative area.
 * E.g. "Wiesbaden" or "Germany", depending on area size.
 * @param zoomLevel {Integer}  0-18 leaflet/OpenLayers zoom level
 *     Result will change based on the zoom level
 * @param resultCallback {Function()}
 *
 * @see http://wiki.openstreetmap.org/wiki/Nominatim#Reverse_Geocoding_.2F_Address_lookup
 */
function nameForArea(lat, long, zoomLevel, resultCallback, errorCallback) {
  loadURL({
    url : "http://www.manyone.zone/geo/reverse",
    urlArgs : {
      lat : lat,
      lon : long,
      zoom : zoomLevel,
      addressdetails : 1,
      format : "json",
    },
    dataType : "json",
  }, function(json) {
    try {
      if (json.error) {
        errorCallback(new Exception(json.error));
        return;
      }
      if ( !json.address.city && json.address.town || json.address.village) {
        json.address.city = json.address.town || json.address.village;
      }
      var name = json.address.city || json.address.state || json.address.country;
      var poi = new POI(
            name,
            lat, long,
            null, // icon
            json.place_id);
      poi.address = json.address; // city, county, state, country, country_code
      resultCallback(poi);
    } catch (e) { errorCallback(e); }
  }, function(e) { errorCallback(e); });
}

/**
 * @see enhancePOI()
 * @param pois {Array of {POI}}  modified in-place
 * @param resultCallback {Function(pois)}
 */
function enhancePOIs(pois, resultCallback, errorCallback) {
  var waiting = pois.length;
  var hadError = false;
  var done = false;
  pois.forEach(function(poi) {
    enhancePOI(poi, function() {
      if ( !--waiting) {
        done = true;
        resultCallback(pois);
      }
    }, function(e) {
      if (hadError) { return; }
      hadError = true;
      errorCallback(e);
    });
  });
}

/**
 * For the POI, tries to find:
 * - DU topic
 * - dbpedia entry
 * - class
 * @param poi {POI}  modified in-place
 * @param resultCallback {Function(poi)}
 */
function enhancePOI(poi, resultCallback, errorCallback) {
  var query = "SELECT * FROM <http://linkedgeodata.org> WHERE {" +
    "<" + poi.id + "> a ?type ." +
  "} LIMIT 20";
  du.sparqlSelect(query, {}, function(rs) {
    poi.types = rs.map(function(result) {
      return result.type.replace("http://linkedgeodata.org/ontology/", "");
    }).filter(function(type) {
      return type.substr(0, 4) != "http" && type != "Amenity";
    });
    poi.types.forEach(function(type) {
      ddebug("POI " + poi.name + " has type " + type);
      switch (type) {
        case "Airport":
          //poi.topic = uninav.findTopicByTitle("Airplane");
          return;
        case "Hotel":
          poi.appURL = makeHotelURL(poi);
          return;
      }
    });
    poi.url = poi.url || poi.appURL;
    if (poi.url) {
      ddebug("POI " + poi.name + " has URL " + poi.url);
    }

    var query = "SELECT * FROM <http://dbpedia.org> WHERE { " +
        "OPTIONAL { " + esc(dbpediaID(poi.name)) + " rdfs:comment ?description . } " +
        "OPTIONAL { " + esc(dbpediaID(poi.name)) + " dbpedia-owl:wikiPageExternalLink ?url . } " +
      "FILTER(langMatches(lang(?description), '" + getLang() + "'))   }";
    sparqlSelect1(query, {}, function(result) {
      poi.description = result.description;
      poi.url = poi.url || result.url;
      ddebug(poi.name + " <" + poi.url + ">");
      ddebug(poi.name + ": " + poi.description);
      resultCallback(poi);
    }, function(e) {
      if ( !(e instanceof NoResult)) {
        errorCallback(e);
      }
      resultCallback(poi);
    });
  }, errorCallback);
}

function makeHotelURL(poi) {
  // @see https://admin.booking.com/affiliate/impl_param.html
  return createURLQueryString("http://www.booking.com/searchresults.html", {
    aid : 804593, // affiliate ID
    si : "ho", // Hotels
    ss : poi.name,
    latitude : poi.lat,
    longitude : poi.long,
    radius : 1,
  });
}
