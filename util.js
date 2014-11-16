
/**
 * @param test {Boolean}
 * @param errorMsg {String}
 */
function assert(test, errorMsg) {
  errorMsg = errorMsg || "assertion failed";
  if ( !test) {
    throw new Exception(errorMsg);
  }
}

function ddebug(msg) {
  if (console) {
    console.debug(msg);
  }
}


/**
 * Create a subtype.
 */
function extend(child, supertype)
{
  child.prototype.__proto__ = supertype.prototype;
}


/**
 * Cleans up exceptions into a common format
 * @param e {Error or Exception or nsIException or String}
 * @param Exception
 */
function convertException(e) {
  // If we didn't get an Exception object (but e.g. a string),
  // create one and give it a stack
  if (typeof e != "object") {
    e = new Exception(e);
  }
  if ( !e.stack) {
    e.stack = Error().stack;
  }
  e.stack = _cleanupStack(e.stack);
  return e;
}


/**
 * Remove any functions from the stack that are related to
 * showing or sending the error.
 */
function _cleanupStack(s) {
  assert(typeof(s) == "string");
  return s.split(/\n/).filter(function(element) {
    if (element.match(/^convertException/) ||
        element.match(/^UserError/) ||
        element.match(/^Exception/) ||
        element.match(/^NotReached/) ||
        element.match(/^assert/) ||
        element.match(/^errorCritical/) ||
        element.match(/^errorNonCritical/) ||
        element.match(/^errorInBackend/))
      return false;
    return true;
    }).join("\n");
}



/**
 * Parses a URL query string into an object.
 *
 * @param queryString {String} query ("?foo=bar&baz=3") part of the URL,
 *     with or without the leading question mark
 * @returns {Object} JS map { name1 : "value", name2: "othervalue" }
 */
function parseURLQueryString(queryString)
{
  var queryParams = {};
  if (queryString.charAt(0) == "?" || queryString.charAt(0) == "#")
    queryString = queryString.substr(1); // remove leading "?" or "#", if it exists
  var queries = queryString.split("&");
  for (var i = 0; i < queries.length; i++) {
    try {
      if ( !queries[i]) {
        continue;
      }
      var querySplit = queries[i].split("=");
      var value = querySplit[1].replace(/\+/g, " "); // "+" is space, before decoding
      queryParams[querySplit[0]] = decodeURIComponent(value);
    } catch (e) {
      // Errors parsing the query string are not fatal, we should just continue
      errorNonCritical(e);
    }
  }
  return queryParams;
}


function getLang() {
  return "en";
}


function esc(str) {
  // TODO
  return str
    .replace(/\&/g, "and")
    .replace(/\"/g, "'")
    .replace(/ /g, "_");
}

var cRDFPrefixes = {
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  dc: "http://purl.org/dc/elements/1.1/",
  foaf: "http://xmlns.com/foaf/0.1/",
  dbpedia: "http://dbpedia.org/resource/",
  dbpediaprop: "http://dbpedia.org/property/",
  dbpediaowl: "http://dbpedia.org/ontology/",
  geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  geonames: "http://www.geonames.org/ontology#",
  freebase: "http://rdf.freebase.com/ns/",
  owl: "http://www.w3.org/2002/07/owl#",
  skos: "http://www.w3.org/2004/02/skos/core#",
};

function sparqlSelect(query, params, resultCallback, errorCallback) {
  assert(params && typeof(params) == "object", "Need params");
  var url;
  if (params.url) {
    url = params.url;
  } else if (params.endpoint) {
    url = "/sparql/" + params.endpoint + "/";
  } else {
    url = "/sparql/m1/";
  }
  params.prefixes = params.prefixes || cRDFPrefixes;
  if (params.prefixes) {
    for (var prefix in params.prefixes) {
      if (query.indexOf(prefix + ":") != -1) {
        query = "PREFIX " + prefix + ": <" + params.prefixes[prefix] + "> " + query;
      }
    }
  }
  ddebug("Running SPARQL query: " + query);
  loadURL({
    url : url,
    urlArgs : {
      query : query,
      format : "application/sparql-results+json",
      output : "json",
      //callback : "load",
    },
    dataType : "json",
  }, function(json) {
    try {
      if (json.results.bindings.length == 0) {
        errorCallback(new SPARQLException(new ServerException("Nothing found", 0, url), query));
        return;
      }
      // drop the .value, and make it a real Array
      var results = [];
      var bindings = json.results.bindings;
      for (var i = 0, l = bindings.length; i < l; i++) {
        var cur = bindings[i];
        var result = {};
        for (var name in cur) {
          result[name] = cur[name].value;
        }
        results.push(result);
      }
      resultCallback(results);
    } catch (e) { errorCallback(e); }
  }, function(e) {
    errorCallback(new SPARQLException(e, query));
  });
}

function sparqlSelect1(query, params, resultCallback, errorCallback) {
  var myResultCallback = function(results) {
    resultCallback(results[0]);
  };
  query += " LIMIT 1";
  sparqlSelect(query, params, myResultCallback, errorCallback);
}


/**
 * Removes |element| from |array|.
 * @param array {Array} to be modified. Will be modified in-place.
 * @param element {Object} If |array| has a member that equals |element|,
 *    the array member will be removed.
 * @param all {boolean}
 *     if true: remove all occurences of |element| in |array.
 *     if false: remove only the first hit
 * @returns {Integer} number of hits removed (0, 1 or more)
 */
function arrayRemove(array, element, all)
{
  var found = 0;
  var pos = 0;
  while ((pos = array.indexOf(element, pos)) != -1)
  {
    array.splice(pos, 1);
    found++
    if ( ! all)
      return found;
  }
  return found;
}

/**
 * Check whether |element| is in |array|
 * @param array {Array}
 * @param element {Object}
 * @returns {boolean} true, if |array| has a member that equals |element|
 */
function arrayContains(array, element)
{
  return array.indexOf(element) != -1;
}


/**
 * Return the contents of an object as multi-line string, for debugging.
 * @param obj {Object} What you want to show
 * @param name {String} What this object is. Used as prefix in output.
 * @param maxDepth {Integer} How many levels of properties to access.
 *    1 = just the properties directly on |obj|
 * @param curDepth {Integer} internal, ignore
 */
function dumpObject(obj, name, maxDepth, curDepth)
{
  if (curDepth == undefined)
    curDepth = 1;
  if (maxDepth != undefined && curDepth > maxDepth)
    return "";

  var result = "";
  var i = 0;
  for (var prop in obj)
  {
    i++;
    if (typeof(obj[prop]) == "xml")
    {
      result += name + "." + prop + "=[object]" + "\n";
      result += dumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
    }
    else if (typeof(obj[prop]) == "object")
    {
      if (obj[prop] && typeof(obj[prop].length) != "undefined")
        result += name + "." + prop + "=[probably array, length " + obj[prop].length + "]" + "\n";
      else
        result += name + "." + prop + "=[object]" + "\n";
      result += dumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
    }
    else if (typeof(obj[prop]) == "function")
      result += name + "." + prop + "=[function]" + "\n";
    else
      result += name + "." + prop + "=" + obj[prop] + "\n";
  }
  if ( ! i)
    result += name + " is empty\n";
  return result;
}


/**
 * @param url {String}   http[s]:// or file:///
 * @param dataType {String-enum}  Expected type of file contents
 *    "text", "json", "xml" or "html"
 * @param urlArgs {Map of name {String} -> value {String}}
 *      extra URL param arguments
 *      {name: "value", name2: "value" } -> "?name=value&name2=value2"
 * @param headers {Map of name {String} -> value {String}}
 *      extra HTTP headers
 * @param username {String}   HTTP Basic auth: username
 * @param password {String}   ditto - password
 * @param successCallback {Function(result)}
 *    result {String or Object or DOMDocument}
 * @param errorCallback {Function(e {Exception or Error})}
 */
function loadURL(params, successCallback, errorCallback) {
  var url = params.url;
  assert(typeof(url) == "string" && url, "need type");
  for (var name in params.urlArgs) {
    url += (url.indexOf("?") == -1 ? "?" : "&") +
            name + "=" + encodeURIComponent(params.urlArgs[name]);
  }
  var dataType = params.dataType;
  assert(typeof(dataType) == "string" && dataType, "need type");

  var mimetype = null;
  //if (url.substr(0, 7) == "file://") {
    if (dataType == "text") {
      mimetype = "text/plain";
    } else if (dataType == "xml") {
      mimetype = "text/xml";
    } else if (dataType == "html") {
      mimetype = "text/html";
    } else if (dataType == "json") {
      //mimetype = "text/plain";
      mimetype = "text/javascript";
    } else {
      assert(false, "unknown dataType");
    }
    mimetype += "; charset=UTF-8";
  //}

  if (params.username && params.password) {
    params.headers = params.headers || {};
    params.headers.Authorization = "Basic " + window.btoa(
        params.username + ":" + params.password);
  }

  /*if (params.lib == "jquery") {
    $.getJSON(url, {
      dataType : dataType,
      success : successCallback,
      error : errorCallback,
    });
    return;
  }*/

  // <copied from="FetchHTTP">
  console.log("trying to open " + url);
  var callStack = Error().stack;

  function statusToException(req) {
    try {
      var errorCode = req.status;
      var errorStr = req.statusText;
      if (errorCode == 0 && errorStr == "" || errorStr == "Failure") {
        errorCode = -2;
        var sb = new StringBundle("appui.properties");
        errorStr = sb.get("cannot_contact_server.error");
      }
      var ex = new ServerException(errorStr, errorCode, url);
      ex.stack = callStack;
      return ex;
    } catch (e) {
      return e;
    }
  }

  function response(req) {
    try {
      var result = null;
      var ex = null;

      // HTTP level success
      var isHTTP = window.location.href.substr(0, 4) == "http";
      if ( !isHTTP ||
          (req.status >= 200 && req.status < 300)) {
        try {
          result = req.responseText;
        } catch (e) {
          var sb = new StringBundle("appui.properties");
          var errorStr = sb.get("bad_response_content.error") + ": " + e;
          ex = new ServerException(errorStr, -4, url);
          ex.stack = callStack;
        }
      } else {
        ex = statusToException(req);
      }

      // Callbacks
      if ( !ex) {
        return result;
      } else {
        errorCallback(ex);
      }
    } catch (e) { errorCallback(e); }
  }
  // </copied>

  var req = new XMLHttpRequest();
  req.onerror = function() {
    errorCallback(statusToException(req));
  };
  req.onload = function() {
    var data = response(req);
    if ( !data) { // errorCallback called
      return;
    }
    if (dataType == "xml") {
      data = req.responseXML;
    } else if (dataType == "html") {
      data = new DOMParser().parseFromString(data, "text/html");
    } else if (dataType == "json") {
      if (data.substr(0, 5) == "load(") {
        data = data.substr(5, data.length - 6);
      }
      data = JSON.parse(data);
    }
    successCallback(data);
  };
  try {
    req.overrideMimeType("text/plain; charset=UTF-8");
    req.open("GET", url, true); // async

    for (var name in params.headers) {
      var val = params.headers[name];
      if ( !val) continue;
      req.setRequestHeader(name, val);
    }

    req.send();
  } catch (e) { // send() throws (!) when file:// URL and file not found
    errorCallback(e);
  }
}

function Exception(msg)
{
  this._message = msg;

  // get stack
  try {
    not.found.here += 1; // force a native exception ...
  } catch (e) {
    this.stack = e.stack; // ... to get the current stack
  }
  //ddebug("ERROR (exception): " + msg + "\nStack:\n" + this.stack);
}
Exception.prototype =
{
  get message()
  {
    return this._message;
  },
  set message(msg)
  {
    this._message = msg;
  },
  toString : function()
  {
    return this._message;
  }
}

function ServerException(serverMsg, code, uri)
{
  var msg = serverMsg;
  /*if (code >= 300 && code < 600) { // HTTP error code
    msg += " " + code;
  }
  msg += "\n\n<" + uri + ">";*/
  Exception.call(this, msg);
  this.rootErrorMsg = serverMsg;
  this.code = code;
  this.uri = uri;
}
ServerException.prototype =
{
}
extend(ServerException, Exception);

/**
 * @param serverEx {ServerException}
 * @param query {String} the SPARQL query string, readable
 */
function SPARQLException(serverEx, query)
{
  var msg = serverEx.rootErrorMsg;
  //msg += "\n\n" + query;
  ServerException.call(this, serverEx.rootErrorMsg, serverEx.code, serverEx.uri);
  this.query = query;
  this._message = msg;
}
SPARQLException.prototype =
{
}
extend(SPARQLException, ServerException);
