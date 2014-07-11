
/**
 * @param test {Boolean}
 * @param errorMsg {String}
 */
function assert(test, errorMsg) {
  errorMsg = errorMsg || "assertion failed";
  if ( !test) {
    alert(errorMsg);
  }
}

function errorCritical(e) {
  alert(e);
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
 * @param url {String}   http[s]:// or file:///
 * @dataType {String-enum}  Expected type of file contents
 *    "text", "json", "xml" or "html"
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
  req.overrideMimeType("text/plain; charset=UTF-8");
  try {
    req.open("GET", url, true); // async
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
  if (code >= 300 && code < 600) { // HTTP error code
    msg += " " + code;
  }
  msg += " <" + uri + ">";  Exception.call(this, msg);
  this.rootErrorMsg = serverMsg;
  this.code = code;
  this.uri = uri;
}
ServerException.prototype =
{
}
extend(ServerException, Exception);
