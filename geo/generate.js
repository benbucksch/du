
function countryList() {
  assert(du, "DU obj not found in Geo");
  var waiting = 0;
  var errorCallback = function(e) {
    waiting--
    errorNonCritical(e);
  }
  var uninav = {};
  uninav.Topic = function() {
    this.parentIDs = [];
    this.childrenIDs = [];
  }
  assert(uninav, "UniNav obj not found");
  var topics = [];
  var tGeo = new uninav.Topic();
  topics.push(tGeo);
  tGeo.id = "root";
  tGeo.title = "Geography";
  [{
    name : "North America", id : "geoNorthAmerica", dbpediaID : "North_America", list : "yago:NorthernAmericanCountries"
  },{
    name : "South America", id : "geoSouthAmerica", dbpediaID : "South_America", list : "yago:SouthAmericanCountries"
  },{
    name : "Europe", id : "geoEurope", dbpediaID : "Europe", list : "yago:EuropeanCountries"
  },{
    name : "Africa", id : "geoAfrica", dbpediaID : "Africa", list: "yago:AfricanCountries"
  },{
    name : "Asia", id : "geoAsia", dbpediaID : "Asia", list: "?cat FILTER(?cat = yago:CentralAsianCountries || ?cat = yago:SouthAsianCountries || ?cat = yago:EastAsianCountries)"
  },{
    name : "Australia", id : "geoAustralia", dbpediaID : "Australia_(continent)", list: "yago:OceanianCountries"
  },{
    name : "Antarctica", id : "geoAntarctica", dbpediaID : "Antarctica", list: "yago:AntarcticanCountries"
  }].forEach(function(continent) {
    var tContinent = new uninav.Topic();
    topics.push(tContinent);
    tContinent.id = continent.id;
    tContinent.title = continent.name;
    tContinent.lodID = "dbpedia:" + continent.dbpediaID;
    tContinent.parentIDs.push(tGeo.id);
    tGeo.childrenIDs.push(tContinent.id);

    var query = "SELECT * FROM <http://dbpedia.org> WHERE { " +
        esc(tContinent.lodID) + " dbpedia-owl:thumbnail ?image . " +
        esc(tContinent.lodID) + " dbpedia-owl:demonym ?denom . }";
    waiting++;
    sparqlSelect1(query, {}, function(result) {
      waiting--;
      tContinent.img = result.image;
      var continentDenom = result.denom; // "European"

      // Get list of countries in continent
      var query = "SELECT DISTINCT ?country ?name FROM <http://dbpedia.org> WHERE { " +
        "?country rdf:type " + continent.list + ". " +
        "?country dbpedia-owl:populationTotal ?population . " +
        "?country rdfs:label ?name . " +
        "FILTER(langMatches(lang(?name), 'en')) " +
      "} ORDER BY DESC (?population) LIMIT 200";
      waiting++;
      sparqlSelect(query, {}, function(results) {
        waiting--;
        results.forEach(function(result) {
          // Hack for Russia
          if (result.name == "Russia" && continent.name == "Europe") { return; }
          var tCountry = new uninav.Topic();
          topics.push(tCountry);
          tCountry.title = result.name;
          tCountry.lodID = result.country
              .replace("http://dbpedia.org/resource/", "dbpedia:");
          tCountry.id = result.country
              .replace("http://dbpedia.org/resource/", "geo")
              .replace("_", "");
          tCountry.parentIDs.push(tContinent.id);
          tContinent.childrenIDs.push(tCountry.id);

          var query = "SELECT DISTINCT ?image FROM <http://dbpedia.org> WHERE { " +
            esc(tCountry.lodID) + " dbpedia-owl:thumbnail ?image . }";
          waiting++;
          sparqlSelect1(query, {}, function(result) {
            waiting--;
            tCountry.img = result.image;
          }, errorCallback);
        });
      }, errorCallback);
    }, errorCallback);
  });
  var interval = setInterval(function() {
    if ( !waiting) {
      clearInterval(interval);
      ddebug(JSON.stringify(topics));
    }
  }, 1000);
}


function fixCountries() {
  // <https://github.com/johan/world.geo.json>
  // <https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json>
  loadURL({ url : "countries.geo.json", dataType: "json" }, function(json) {
    // <http://www.geonames.org/export/ws-overview.html>
    // <http://api.geonames.org/countryInfoJSON?formatted=true&lang=en&username=demo&style=full>
    loadURL({ url : "countriesInfo.json", dataType: "json" }, function(jsonInfo) {
      try {
      var infoMap = {}; // iso3 code -> country info
      jsonInfo.geonames.forEach(function(c) {
        infoMap[c.isoAlpha3] = c;
      });
      json.features.forEach(function(c) {
        ddebug("country " + c.id + " = " + c.properties.name);
        var info = infoMap[c.id];
        ddebug(info, "info not found");
        if ( !info) return;
        c.id = info.countryCode; // fix ID to be 2-letter ISO 3166 code, not 3 letter
        for (var name in info) {
          c.properties[name] = info[name]; // copy info to c.properties
        }
      });
      ddebug("DONE");
      document.querySelector("#output").textContent = JSON.stringify(json);
      } catch (e) { errorCritical(e); }
    }, errorCritical);
  }, errorCritical);
}
