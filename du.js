/**
 * Digital Universe main UI
 *
 * - Creates the frames/panes for UniNav, Activities and content.
 * - Implements the Activity panes
 * - Reacts to topic changes and loads the Activities and content pane content,
 *   i.e. the highest level wiring / controller.
 *
 * (c) 2014 Ben Bucksch
 * License: GPL3, see LICENSE
 */

var gSite;
var gTopic;
var du = this;
var uninav; // set by uninav.js

/**
 * Change to go to another DU topic.
 *
 * This doesn't entirely reload the current page,
 * just changes the content. Called SPA "Single Page Architecture".
 *
 * Currently called directly from uninav iframe.
 * This direction function call works, because it's the same domain.
 * Alternative: events sent via postMessage(), see below.
 * @param topic {Topic}
 * @param changeMode {Integer-Enum}
 *     if 0, it comes from UniNav and we change activities and content
 *     if 1, the change comes from content (animation, geo etc.),
 *     and a complete change is wanted, similar to a normal link click.
 *     The content and activity *shall* be changed,
 *     if 2, the change comes from content (animation, geo etc.).
 *     The content shall *not* be changed, i,e. no default activity loaded,
 *     but the topic in UniNav changes and the activity bar content changes.
 *     I.e. this is a "seamless" topic change, where only the
 *     information in the side frames changes, but the content
 *     stays as-is.
 */
function openTopic(topic, changeMode) {
  changeMode = changeMode || 0;

  gTopic = topic;
  try {
    $scope = angular.element(document.querySelector("body")).scope();
    $scope.$apply(function() {
      $scope.topic = topic;
    });
  } catch (e) { errorCritical(e); }
  E("title").textContent = topic.title;

  if (changeMode == 0 || changeMode == 1) {
    // Change content
    loadActivityDefault(topic);
  }
  if (changeMode == 1 || changeMode == 2) {
    // Change UniNav
    //var uninav = E("uninav").contentWindow;
    uninav.showTopic(topic);
  }
}

/**
 * Called on load to set a topic based on the domain visited
 */
function startupTopic() {
  var params = parseURLQueryString(window.location.search);
  gSite = params.site || window.location.hostname;
  if (gSite == "www.manyone.zone" || gSite == "manyone.zone") {
    params.siteWords = "Digital Universe";
  }
  var title = params.siteWords || gSite;
  return { // Fake topic
    title : title,
    lodID : "dbpedia:" + title.split(" ")[0],
  };
}

function onLoad() {
  // UI
  /*$("#activities").accordion({
    header: "h2",
  });*/
  $("body").w2layout({
    name: "layout",
    resizer: 3,
    panels: [
      { type: "top", size: 200, resizable: true, content: $("#uninav-pane") },
      { type: "left", size: 200, resizable: true, content: $("#activities-pane") },
      { type: "main", size: 200, resizable: true, content: $("#content-pane") },
    ],
  });

  openTopic(startupTopic(), 0);
}
window.addEventListener("DOMContentLoaded", onLoad, false);


angular.module("duTopic", [])
  .controller("TopicCtrl", function($scope) {
    $scope.topic = gTopic;
  })
  ;

function dbpediaIDForTopic(topic) {
  if ( !topic.lodID) {
    topic.lodID = dbpediaID(topic.title);
  }
  return topic.lodID;
}

/**
 * Decides which activity to load for a given topic
 *
 * Try, in order:
 * - Explore (animation)
 * - Geo (Map)
 * - Unterstand (Wikipedia)
 */
function loadActivityDefault(topic) {
  if (haveActivityExplore(topic)) {
    loadActivityExplore(topic);
  } else {
    haveActivityGeo(topic, function() {
      loadActivityGeo(topic);
    }, function(e) { // no geo location found
      loadActivityUnderstand(topic);
    });
  }
}

function loadActivityLearn(topic) {
  clearContentPage();
  var query = "SELECT ?abstract FROM <http://dbpedia.org> WHERE { " +
    esc(dbpediaIDForTopic(topic)) + " dbpedia-owl:abstract ?abstract . " +
    "filter(langMatches(lang(?abstract), '" + getLang() + "')) " + // one lang
  "}";
  sparqlSelect1(query, {}, function(result) {
    var abstract = result.abstract;
    assert(abstract, "No abstract found for: " + topic.title);
    // TODO make a proper page
    var emptyHTML = "data:text/html;<html><body></body></html>";
    loadContentPage(emptyHTML, topic.title);
    E("content").contentDocument.documentElement.textContent = abstract;
  }, errorCritical);
}

function haveActivityExplore(topic) {
  return !!topic.exploreURL;
}

function loadActivityExplore(topic) {
  loadContentPage(topic.exploreURL, "Explore " + topic.title);
}

function loadActivityUnderstand(topic) {
  var url = topic.descriptionURL;
  if ( !url) {
    var id = dbpediaIDForTopic(topic).replace("dbpedia:", "");
    url = "http://en.m.wikipedia.org/wiki/" + encodeURIComponent(id);
  }
  loadContentPage(url, "Understand " + topic.title);
}

function loadActivityWatch(topic) {
  loadContentPage(
      // "https://www.youtube.com/results?search_query=" + youtube forbids framing
      "https://video.search.yahoo.com/search/?p=" +
      encodeURIComponent(topic.title),
      "Watch " + topic.title + " movies");
}

function loadActivityCreate(topic) {
  var domain = topic.title.replace(/[ \&\,]*/g, "").toLowerCase() + "expert.org";
  var url = "http://www.securepaynet.net/domains/search.aspx?prog_id=473220&domainToCheck=" + domain + "&tld=.org&checkAvail=1";
  loadContentPage(url, "Create the " + topic.title + " portal");
}

function loadActivityNews(topic) {
  loadContentPage(
      "http://" + gSite + "/activity-news.php",
      "News");
}

function loadActivityGeo(topic) {
  clearContentPage();
  haveActivityGeo(topic, function(lat, lon) {
    var url = "geo/#lat=" + lat + "&lon=" + lon;
    loadContentPage(url, "Go to " + topic.title);
  }, errorCritical);
}

/**
 * Gets geo location (lat/long), if available.
 * And caches it.
 */
function haveActivityGeo(topic, resultCallback, errorCallback) {
  if (topic.geo) {
    resultCallback(topic.geo.lat, topic.geo.lon);
    return;
  }
  var query = "SELECT * FROM <http://dbpedia.org> WHERE {" +
    esc(dbpediaIDForTopic(topic)) + " geo:lat ?lat ; " +
    " geo:long ?lon . " +
  "}";
  sparqlSelect1(query, {}, function(result) {
    resultCallback(parseFloat(result.lat), parseFloat(result.lon));
  }, errorCallback);
}

function loadContentPage(url, title, keepFrame) {
  ddebug("open URL " + url);
  E("title").textContent = title;
  var iframe = E("content");
  iframe.src = url;
}

function clearContentPage() {
  E("title").textContent = "Loading...";
  E("content").src = "";
}
