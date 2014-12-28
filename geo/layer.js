/**
 * Fetches data from LOD server and displays scalars as colored areas.
 *
 * Steps:
 * - Areas: Get a list of geographical areas (e.g. countries, regions, cities)
 *   from geonames LOD, including polygons
 * - Values: For this list (by ID), get a certain property,
 *   e.g. Population from WorldBank, from Freebase LOD
 * - Colors: Get numeric range (min/max) of values, and map it
 *   to a color range.
 * - Create a layer with polygon features, using this color.
 *
 * (c) 2014 Ben Bucksch
 * License: GPL3, see LICENSE
 */

/**
 * @param resultCallback {Function({Array of {Area}})}
 * @param errorCallback {Function(e)}
 */
function showStats(property, resultCallback, errorCallback) {
  layerFetchCountries(function(countries) {
    layerFetchValuesForCountries(countries, "factbook:" + property, function(countries) {
      var valueFunc = function(region) { return log2(region.value); }
      layerSetColor(countries, valueFunc, {r: 50, g: 0, b: 0, a: 0.5}, {r: 255, g: 0, b: 0, a: 0.5});
      //layerSetMultipleColors(countries, valueFunc, null, null, 0.5);
      resultCallback(countries);
    }, errorCallback);
  }, errorCallback);
}

/**
 * Get a list of geographical areas (e.g. countries, regions, cities)
 *   from GeoJSON, including polygons
 * @param resultCallback {Function(countries {Array of {Area})}
 * @param errorCallback {Function(e)}
 * whereby country.id = ISO 3166-2 country code, in upper case, e.g. "DE"
 */
function layerFetchCountries(resultCallback, errorCallback) {
  loadURL({ url : "countries.geo.json", dataType: "json" }, function(json) {
    var countries = json.features.map(function(result) {
      assert(result.id, "Need country code");
      var c = new Area(result.properties.name, result.id.toUpperCase());
      c.code = c.id;
      c.geoJSON = result;
      return c;
    });
    ddebug("Have " + countries.length + " countries");
    resultCallback(countries);
  }, errorCallback);
}

/**
 * Get a list of geographical areas (e.g. countries, regions, cities)
 *   from geonames LOD, including polygons
 * @param resultCallback {Function(countries {Array of {Area})}
 * @param errorCallback {Function(e)}
 *
 * whereby country.id = Geonames ID
 * and country.code = ISO 3166-2 country code, in upper case, e.g. "DE"
 */
function layerFetchCountriesFromGeonames(resultCallback, errorCallback) {
  var query = "SELECT * FROM <http://geonames.org> WHERE { " +
    "?country geonames:featureCode geonames:A.PCLI . " +
    "?country geonames:countryCode ?code . " +
    "?country geonames:name ?name . " +
    //"?country geo:geometry ?geo . " +
    "?country geo:lat ?lat . " +
    "?country geo:long ?long . " +
  "} LIMIT 300";
  du.sparqlSelect(query, {}, function(rs) {
    var countries = rs.map(function(result) {
      assert(result.code, "Need country code");
      assert(result.lat, "Need lat for " + result.name);
      assert(result.long, "Need long for " + result.name);

      // TODO geo:geometry POLYGON() needed.
      /*var c = new Area(result.name, result.country);
      c.code = result.code;
      //c.addPoint(result.lat, result.long);
      const d = 0.1;
      c.addPoint(result.lat - d, result.long - d);
      c.addPoint(result.lat + d, result.long - d);
      c.addPoint(result.lat + d, result.long + d);
      c.addPoint(result.lat - d, result.long + d);
      //c.addPoint(result.lat - d, result.long - d);
      c.finished();*/
      var c = new POI(result.name, result.lat, result.long, null, result.country);
      c.code = result.code.toUpperCase();
      return c;
    });
    resultCallback(countries);
  }, errorCallback);
}

/**
 * Fetch values - e.g. population - from LOD for each region.
 *
 * @param property {String}  e.g. "factbook:GDP_percapita_PPP"
 *    Must be an Integer or double value
 *    See <http://wifo5-03.informatik.uni-mannheim.de/factbook/page/Germany>
 * @param regions {Array of {Area}} (in/out)
 *    Subjects for which to query the values.
 *    The values will be added to this object, too, as |.value|
 * @param resultCallback {Function(countries)}
 *    countries like input, but may have some countries removed
 *    for which we have no values.
 * @param errorCallback {Function(e)}
 */
function layerFetchValuesForCountries(countries, property,
                                      resultCallback, errorCallback) {
  assert(countries[0] && countries[0].code, "No country");
  var countryMap = {}; // code {String} -> country
  var countryNameMap = {}; // name {String} -> country
  countries.forEach(function(c) {
    countryMap[c.code] = c;
    countryNameMap[c.name] = c;
  });

  var query = "SELECT * WHERE { " +
    "?country a factbook:Country . " +
    "?country factbook:internetcountrycode ?domain . " +
    "OPTIONAL { ?country factbook:name ?name } . " +
    "?country " + property + " ?value . " +
  "} LIMIT 300";
  du.sparqlSelect(query, { endpoint : "factbook" }, function(rs) {
    //ddebug("have " + rs.length + " results with values");
    rs.forEach(function(result) {
      result.code = result.domain.split(";")[0].substr(1).toUpperCase();
      //ddebug("code " + result.code + " domain " + result.domain);
      var c = countryMap[result.code];
      if ( !c) {
        c = countryNameMap[result.name];
      }
      if ( !c) {
        ddebug("Country " + result.code + " " + result.name + " NOT FOUND");
        return;
      }
      if ( !c) return;
      c.value = parseFloat(result.value);
      //ddebug("country " + c.name + " " + property + " " + c.value);
    });
    countries = countries.filter(function(c) {
      return c.value != undefined && !isNaN(c.value);
    });
    //ddebug("have " + countries.length + " countries with values");
    resultCallback(countries);
  }, errorCallback);
}


/**
 * Maps a single numeric value to a gradient between 2 given colors.
 *
 * Go through list of regions, determine range (min/max) of |.value|,
 * map the values to colors, and
 * write the colors into |.color|.
 *
 * @param regions {Array of {Area}} (in/out)
 *    Read |.value| {integer or float}
 *    Write |.color| {Color}
 *    Write |.colorCSS| {String} CSS color notation, e.g. "#ffcc0e"
 * @param valueFunc {Function(region {Area}) : Float} (Optional)
 *    Allows to transform the value before comparing.
 *    Use e.g. |return log2(region.value);| for logarithmic output.
 *    By default (when null passed), returns |region.value|;
 * @param minColor {Color}
 * @param maxColor {Color}
 * whereby
 * Color {r {Integer}, g {Integer}, b {Integer}, a {Float}} rgb: 0..255, a: 0..0.1
 */
function layerSetColor(regions, valueFunc, minColor, maxColor) {
  if (regions.length == 0) return;
  var defaultFunc = function(region) { return region.value; };
  if (typeof(valueFunc) != "function") valueFunc = defaultFunc;
  var min = valueFunc(regions[0]);
  var max = min + 0.1; // avoid div 0
  regions.forEach(function(region) {
    min = Math.min(min, valueFunc(region));
    max = Math.max(max, valueFunc(region));
  });
  var valueBase = min;
  var valueSpan = max - min;
  var colorSpan = [];
  colorSpan.r = maxColor.r - minColor.r;
  colorSpan.g = maxColor.g - minColor.g;
  colorSpan.b = maxColor.b - minColor.b;
  colorSpan.a = maxColor.a - minColor.a;

  regions.forEach(function(region) {
    var multiplier = (valueFunc(region) - valueBase) / valueSpan;
    region.color = [];
    region.color.r = Math.floor(minColor.r + colorSpan.r * multiplier);
    region.color.g = Math.floor(minColor.g + colorSpan.g * multiplier);
    region.color.b = Math.floor(minColor.b + colorSpan.b * multiplier);
    region.color.a = minColor.a + colorSpan.a * multiplier;
    region.colorCSS = colorRGBToCSS(region.color);
  });
}

/**
 * Maps up 2 or 3 numeric values to different RGB colors, respectively.
 *
 * Go through list of regions, determine range (min/max) of
 * properties A, B, C, and map each to color values of
 * red, green, blue, respectively, and
 * write the colors into |.color|.
 *
 * E.g. A = "population" and B = "GDP" and C = null,
 * then red part will represent population, green part will represent GDP,
 * and blue will be unused (in this example, but you could use blue, too).
 * Then completely red means high population, low GDP,
 * completely green means low population, high GDP,
 * yellow means high population and high GDP,
 * and black means low population and low GDP.
 *
 * @param regions {Array of {Area}} (in/out)
 *    [propertyRed] {integer or float}
 *    Write |.valueR| {integer or float} etc.
 *    Write |.color| {Color}
 *    Write |.colorCSS| {String} CSS color notation
 * @param valueFuncRed {Function(region {Area}) : Float} (Optional)
 *    Allows to transform the value before comparing.
 *    Use e.g. |return log2(region.value);| for logarithmic output.
 *    Be default, returns 0; , i.e. don't use this color part
 * @param valueFuncGreen {Function(region {Area}) : Float} (Optional)
 * @param valueFuncBlue {Function(region {Area}) : Float} (Optional)
 * @param alpha {Float} 0..1.0, normally should be 0.5
 */
function layerSetMultipleColors(regions,
      valueFuncRed, valueFuncGreen, valueFuncBlue, alpha) {
  if (regions.length == 0) return;
  var nullFunc = function(region) { return 0; };
  if (typeof(valueFuncRed) != "function") valueFuncRed = nullFunc;
  if (typeof(valueFuncGreen) != "function") valueFuncGreen = nullFunc;
  if (typeof(valueFuncBlue) != "function") valueFuncBlue = nullFunc;

  var minR = valueFuncRed(regions[0]);
  var maxR = minR + 0.1; // avoid div 0
  var minG = valueFuncGreen(regions[0]);
  var maxG = minG + 0.1; // avoid div 0
  var minB = valueFuncBlue(regions[0]);
  var maxB = minB + 0.1; // avoid div 0
  regions.forEach(function(region) {
    region.valueR = valueFuncRed(region);
    region.valueG = valueFuncGreen(region);
    region.valueB = valueFuncBlue(region);
    minR = Math.min(minR, region.valueR);
    maxR = Math.max(maxR, region.valueR);
    minG = Math.min(minG, region.valueB);
    maxG = Math.max(maxG, region.valueB);
    minB = Math.min(minB, region.valueB);
    maxB = Math.max(maxB, region.valueB);
  });
  var valueBaseR = minR;
  var valueSpanR = maxR - minR;
  var valueBaseG = minG;
  var valueSpanG = maxG - minG;
  var valueBaseB = minB;
  var valueSpanB = maxB - minB;

  regions.forEach(function(region) {
    region.color = [];
    region.color.r = Math.floor((region.valueR - valueBaseR) / valueSpanR * 255);
    region.color.g = Math.floor((region.valueG - valueBaseG) / valueSpanG * 255);
    region.color.b = Math.floor((region.valueB - valueBaseB) / valueSpanB * 255);
    region.color.a = alpha;
    region.colorCSS = colorRGBToCSS(region.color);
  });
}

/**
 * @param color {r {Integer}, g {Integer}, b {Integer}, a {Integer}}
 * @returns {String} CSS color notation, e.g. "#ffcc0e"
 *     Drops alpha part
 */
function colorRGBToCSS(color) {
  //return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + color.a + ")";
  function toHex(num) {
    var r = new Number(num).toString(16);
    return (r.length == 1 ? "0" : "") + r; // always length 2
  }
  return "#" + toHex(color.r) + toHex(color.g) + toHex(color.b);
}

function log10(x) {
  return Math.log(x) / Math.LN10;
}

function log2(x) {
  return Math.log(x) / Math.LN2;
}
