/**
 * Labrasol main UI
 *
 * - Creates the frames/panes for TopicNav, Activities and content.
 * - Implements the Activity panes
 * - Reacts to topic changes and loads the Activities and content pane content,
 *   i.e. the highest level wiring / controller.
 *
 * (c) 2014-2015 Ben Bucksch
 * License: GPL3, see LICENSE
 */

var gSite;
var gActivities;
var gScope;
var du = this;
var uninav; // set by uninav.js

/**
 * Change to go to another topic.
 *
 * This doesn't entirely reload the current page,
 * just changes the content. Called SPA "Single Page Architecture".
 *
 * Currently called directly from TopicNav iframe.
 * This direction function call works, because it's the same domain.
 * Alternative: events sent via postMessage(), see below.
 * @param topic {Topic}
 * @param changeMode {Integer-Enum}
 *     if 0, it comes from TopicNav and we change activities and content
 *     if 1, the change comes from content (animation, geo etc.),
 *     and a complete change is wanted, similar to a normal link click.
 *     The content and activity *shall* be changed,
 *     if 2, the change comes from content (animation, geo etc.).
 *     The content shall *not* be changed, i,e. no default activity loaded,
 *     but the topic in TopicNav changes and the activity bar content changes.
 *     I.e. this is a "seamless" topic change, where only the
 *     information in the side frames changes, but the content
 *     stays as-is.
 */
function openTopic(topic, changeMode) {
  gScope.$apply(function() {
    try {
      changeMode = changeMode || 0;

      gScope.topic = topic;
      E("title").textContent = topic.title;

      gActivities.setTopic(topic, function() {
        if (changeMode == 0 || changeMode == 1) {
          // Change content
          gActivities.startMain();
        }
        gScope.$apply();
      }, function(e) {
        errorCritical(e);
        gScope.$apply();
      });

      if (changeMode == 1 || changeMode == 2) {
        // Change TopicNav
        //var uninav = E("topicnav").contentWindow;
        uninav.showTopic(topic);
      }
    } catch (e) { errorCritical(e); }
  });
}

/**
 * Called on load to set a topic based on the domain visited
 */
function startupTopic() {
  var params = parseURLQueryString(window.location.search);
  gSite = params.site || window.location.hostname;
  if (gSite.indexOf("labrasol") != -1) {
    params.siteWords = "Labrasol"; // TODO default page
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
      { type: "top", size: 200, resizable: true, content: $("#topicnav-pane") },
      { type: "left", size: 200, resizable: true, content: $("#activities-pane") },
      { type: "main", size: 200, resizable: true, content: $("#content-pane") },
    ],
  });
}
window.addEventListener("DOMContentLoaded", onLoad, false);


var app = angular.module("duTopic", [])
  .controller("TopicCtrl", function($scope) {
    ddebug("controller startup");
    gScope = $scope;
    gActivities = new AllActivity();
    gScope.activities = gActivities.activities;

    setTimeout(function() { // https://docs.angularjs.org/error/$rootScope/inprog?p0=$apply
      openTopic(startupTopic());
    }, 0);
  })
  ;

app.run(function($rootScope) {
  ddebug("startup");
});



function Activity() {
  this.$scope = gScope;
}
Activity.prototype = {
  /**
   * {Topic} from TopicNav
   */
  topic : null,
  enabled : true,

  setTopic : function(topic, successCallback, errorCallback) {
    assert(typeof(topic) == "object", "Need topic");
    this.topic = topic;
    var self = this;
    this.getEnabled(function(enabled) {
      if (enabled) {
        self.getPanelContent(successCallback, errorCallback);
      } else {
        successCallback();
      }
    }, function(e) {
      self.enabled = false;
      errorCallback(e);
    });
  },
  /**
   * Checks whether this activity is available for |topic|.
   * This may be an async call.
   *
   * @param resultCallback {Function(boolean enabled)}
   */
  getEnabled : function(resultCallback, errorCallback) {
    resultCallback(this.enabled);
  },
  /**
   * Gets and displays the content of the panel in the sidebar.
   * @param successCallback {Function()} content fetched
   *    and properties of this object filled
   */
  getPanelContent : function(successCallback, errorCallback) {
    successCallback();
  },
  /**
   * Loads this activity in the main content pane.
   */
  startMain : function() {
    throw new NotReached("abstract interface");
  },
}

/**
 * Manages all activities
 */
function AllActivity() {
  Activity.call(this);
  this.activities = {
    understand : new UnderstandActivity(),
    explore : new ExploreActivity(),
    geo : new GeoActivity(),
    news : new NewsActivity(),
    see : new DisabledActivity(),
    watch : new WatchActivity(),
    play : new DisabledActivity(),
    create : new CreateActivity(),
    credits : new DisabledActivity(),
  };
}
AllActivity.prototype = {
  enabled : true,
  setTopic : function(topic, successCallback, errorCallback) {
    var waiting = 0;
    var done = function() {
      if (--waiting == 0) {
        successCallback();
      }
    };
    for (var name in this.activities) {
      var activity = this.activities[name];
      waiting++;
      activity.setTopic(topic, done, done);
    }
  },
  /**
   * Decides which activity to load for a given topic
   *
   * Try, in order:
   * - Explore (animation)
   * - Geo (Map)
   * - Unterstand (Wikipedia)
   */
  startMain : function() {
    var a = this.activities;
    if (a.explore.enabled) {
      a.explore.startMain();
    } else if (a.geo.enabled) {
      a.geo.startMain();
    } else {
      a.understand.startMain();
    }
  },
}
extend(AllActivity, Activity);

function DisabledActivity() {
  Activity.call(this);
}
DisabledActivity.prototype = {
  enabled : false,

  setTopic : function(topic, successCallback, errorCallback) {
    assert(typeof(topic) == "object", "Need topic");
    this.topic = topic;
    successCallback();
  },
  getEnabled : function(resultCallback, errorCallback) {
    resultCallback(false);
  },
  getPanelContent : function(successCallback, errorCallback) {
    successCallback();
  },
  startMain : function() {
  },
}
extend(DisabledActivity, Activity);



function UnderstandActivity() {
  Activity.call(this);
}
UnderstandActivity.prototype = {
  getEnabled : function(resultCallback, errorCallback) {
    resultCallback(true);
  },
  getPanelContent : function(successCallback, errorCallback) {
    var self = this;
    var query = "SELECT ?abstract FROM <http://dbpedia.org> WHERE { " +
      esc(dbpediaIDForTopic(this.topic)) + " dbpedia-owl:abstract ?abstract . " +
      "filter(langMatches(lang(?abstract), '" + getLang() + "')) " + // one lang
    "}";
    sparqlSelect1(query, {}, function(result) {
      var abstract = result.abstract;
      ddebug("Got abstract " + abstract);
      assert(abstract && abstract.length, "No abstract found for: " + self.topic.title);
      if (abstract.length > 200) {
        abstract = abstract.substr(0, 200);
        abstract += "… (More…)";
      }
      self.topic.abstract = abstract;
      successCallback();
    }, errorCallback);
  },
  startMain : function() {
    var url = this.topic.descriptionURL;
    if ( !url) {
      var id = dbpediaIDForTopic(this.topic).replace("dbpedia:", "");
      url = "http://en.m.wikipedia.org/wiki/" + encodeURIComponent(id);
    }
    loadContentPage(url, "Understand " + this.topic.title);
  },
}
extend(UnderstandActivity, Activity);


function GeoActivity() {
  Activity.call(this);
}
GeoActivity.prototype = {
  enabled : false,
  /**
   * Gets geo location (lat/long), if available.
   * And caches it.
   */
  getEnabled : function(resultCallback, errorCallback) {
    if (this.topic.geo) {
      this.geo = this.topic.geo;
      this.enabled = true;
      resultCallback(this.enabled);
      return;
    } else if (this.topic.noGeo) {
      this.enabled = false;
      resultCallback(this.enabled);
      return;
    }
    var self = this;
    var query = "SELECT * FROM <http://dbpedia.org> WHERE {" +
      esc(dbpediaIDForTopic(this.topic)) + " geo:lat ?lat ; " +
      " geo:long ?lon . " +
    "}";
    sparqlSelect1(query, {}, function(result) {
      self.geo = self.topic.geo = {
        lat : parseFloat(result.lat),
        lon : parseFloat(result.lon),
      };
      self.enabled = true;
      resultCallback(true);
    }, function(e) {
      self.enabled = false;
      if (e instanceof NoResult) {
        self.topic.noGeo = true;
        resultCallback(self.enabled);
      } else {
        errorCallback(e);
      }
    });
  },
  getPanelContent : function(successCallback, errorCallback) {
    successCallback();
  },
  startMain : function() {
    ddebug("loading map for " + this.topic.title);
    assert(this.enabled);
    var geo = this.topic.geo;
    var url = "geo/#lat=" + geo.lat + "&lon=" + geo.lon;
    loadContentPage(url, "Go to " + this.topic.title);
  },
}
extend(GeoActivity, Activity);


function ExploreActivity() {
  Activity.call(this);
}
ExploreActivity.prototype = {
  enabled : false,
  getEnabled : function(resultCallback, errorCallback) {
    this.enabled = !!this.topic.exploreURL
    resultCallback(this.enabled);
  },
  getPanelContent : function(successCallback, errorCallback) {
    successCallback();
  },
  startMain : function() {
    assert(this.enabled);
    loadContentPage(this.topic.exploreURL, "Explore " + this.topic.title);
  },
}
extend(ExploreActivity, Activity);


function WatchActivity() {
  Activity.call(this);
}
WatchActivity.prototype = {
  startMain : function() {
    assert(this.enabled);
    loadContentPage(
        // "https://www.youtube.com/results?search_query=" + youtube forbids framing
        "https://video.search.yahoo.com/search/?p=" +
        encodeURIComponent(this.topic.title),
        "Watch " + this.topic.title + " movies");
  },
}
extend(WatchActivity, Activity);

function CreateActivity() {
  Activity.call(this);
}
CreateActivity.prototype = {
  startMain : function() {
    var domain = this.topic.title.replace(/[ \&\,]*/g, "").toLowerCase() + "expert.org";
    var url = "http://www.securepaynet.net/domains/search.aspx?prog_id=473220&domainToCheck=" + domain + "&tld=.org&checkAvail=1";
    loadContentPage(url, "Create the " + this.topic.title + " portal");
  },
}
extend(CreateActivity, Activity);

function NewsActivity() {
  Activity.call(this);
}
NewsActivity.prototype = {
  startMain : function() {
    loadContentPage(
        "http://" + gSite + "/activity-news.php",
        "News");
  },
}
extend(NewsActivity, Activity);


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


function dbpediaIDForTopic(topic) {
  if ( !topic.lodID) {
    topic.lodID = dbpediaID(topic.title);
  }
  return topic.lodID;
}
