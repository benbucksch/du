var gSite;
var gTopic;

/**
 * Change to go to another DU topic.
 *
 * This doesn't entirely reload the current page,
 * just changes the content. Called SPA "Single Page Architecture".
 *
 * Currently called directly from uninav iframe.
 * This direction function call works, because it's the same domain.
 * Alternative: events sent via postMessage(), see below.
 */
function openTopic(topic) {
  gTopic = topic;
  Ext.getCmp("content-pane").removeAll();
  Ext.getCmp("content-pane").setTitle(topic.title);
  loadActivityDefault(topic);
}

/**
 * Called on load to set a topic based on the domain visited
 */
function startupTopic() {
  var params = parseURLQueryString(window.location.search);
  gSite = params.site || window.location.hostname;
  var title = params.siteWords || gSite;
  openTopic({ // Fake topic
    title : title,
  });
}

function dbpediaID(topic) {
  if ( !topic.dbpediaID) {
    var title = topic.title
        .replace(/ \&.*/g, "") // HACK: With "A&B", take only A
        .replace(/, .*/g, "") // HACK: With "A, B & C", take only A
        .replace(/ /g, "_"); // Spaces -> _
    title = title[0] + title.substr(1).toLowerCase(); // Double words in lowercase
    topic.dbpediaID = title;
  }
  return "dbpedia:" + topic.dbpediaID;
}

function esc(str) {
  // TODO
  return str
    .replace(/\&/g, "and")
    .replace(/\"/g, "'")
    .replace(/ /g, "_");
}

function sparqlSelect(query, resultCallback, errorCallback) {
  loadURL({
    url : "http://sparql.manyone.zone/sparql",
    urlArgs : {
      query : query,
      format : "application/sparql-results+json",
      callback : "load",
    },
    dataType : "json",
  }, function(json) {
    try {
      resultCallback(json.results.bindings[0]);
    } catch (e) { errorCallback(e); }
  }, errorCallback);
}

Ext.application({
    name : "Digital Universe",
    launch : function() {
      createUI();
      startupTopic();
    },
});

function createUI() {
  var uninav = Ext.create('Ext.Component', {
    autoEl: {
        tag: 'iframe',
        src: "../uninav/uninav.html",
    }
  });
  Ext.create('Ext.container.Container', {
    renderTo: Ext.getBody(),
    title: "Digital Universe",
    width: '100%',
    height: '100%',
    layout: 'border',
    items: [{
        region: 'west',
        title: "Activities",
        id: "activities-pane",
        xtype: 'panel',
        slayout: 'accordion',
        items: [
        {
          title: "Inform",
          id: "activity-inform",
        },{
          title: "Understand",
          id: "activity-understand",
        },{
          title: "Locate",
          id: "activity-geo",
        },{
          title: "Explore",
          id: "activity-explore",
          disabled : true,
        },{
          title: "Learn",
          id: "activity-learn",
          disabled : true,
        },{
          title: "Watch",
          id: "activity-watch",
        },{
          title: "Listen",
          id: "activity-listen",
          disabled : true,
        },{
          title: "Play",
          id: "activity-play",
          disabled : true,
        },{
          title: "Create",
          id: "activity-create",
        },{
          title: "Teach",
          id: "activity-teach",
          disabled : true,
        },{
          title: "Discuss",
          id: "activity-discuss",
          disabled : true,
        }],
        width: 200,
        height: '100%',
        collapsible: true,
        split: true,
    },{
        region: 'east',
        title: "Examine",
        id: "details-pane",
        xtype: 'panel',
        layout: 'accordion',
        items: [],
        width: 200,
        height: '100%',
        hidden: true,
        collapsible: true,
        split: true,
    },{
        region: 'north',
        xtype: 'container',
        title: "UniNav",
        id: "uninav-pane",
        height: 200,
        width: '100%',
        split: true,
        items : [uninav],
        layout: 'fit'
    },{
        region: 'center',
        xtype: 'panel',
        title: "",
        id: "content-pane",
        layout: 'fit'
    }],
  });
  Ext.getCmp("activity-learn").getEl().on("click", function() {
    loadActivityLearn(gTopic);
  });
  Ext.getCmp("activity-inform").getEl().on("click", function() {
    loadActivityNews(gTopic);
  });
  Ext.getCmp("activity-watch").getEl().on("click", function() {
    loadActivityWatch(gTopic);
  });
  Ext.getCmp("activity-understand").getEl().on("click", function() {
    loadActivityUnderstand(gTopic);
  });
  Ext.getCmp("activity-create").getEl().on("click", function() {
    loadActivityCreate(gTopic);
  });
  Ext.getCmp("activity-geo").getEl().on("click", function() {
    loadActivityGeo(gTopic);
  });
}

/**
 * Decides which activity to load for a given topic
 */
function loadActivityDefault(topic) {
  getLocation(topic, function() { // have location
    loadActivityGeo(topic);
  }, function(e) { // no location found
    loadActivityUnderstand(topic);
  });
}

function loadActivityLearn(topic) {
  Ext.getCmp("content-pane").removeAll(); // clear old content
  var query = "SELECT ?abstract WHERE {" +
    esc(dbpediaID(topic)) + " dbpedia-owl:abstract ?abstract" + " . " +
    "filter(langMatches(lang(?abstract), '" + getLang() + "'))" + // one lang
  "} limit 1";
  sparqlSelect(query, function(result) {
    var abstract = result.abstract.value;
    assert(abstract, "No abstract found for: " + topic.title);
    Ext.getCmp("content-pane").update(abstract); // sets content
  }, errorCritical);
}

function loadActivityUnderstand(topic) {
  var page = dbpediaID(topic).replace("dbpedia:", "");
  loadContentPage(
      "http://en.m.wikipedia.org/wiki/" + encodeURIComponent(page),
      "Understand " + topic.title);
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
  Ext.getCmp("content-pane").removeAll(); // clear old content
  getLocation(topic, function(lat, lon) {
    var url = "geo/?lat=" + lat + "&lon=" + lon;
    loadContentPage(url, "Go to " + topic.title);
  }, errorCritical);
}

function getLocation(topic, resultCallback, errorCallback) {
  if (topic.geo) {
    resultCallback(topic.geo.lat, topic.geo.lon);
    return;
  }
  var query = "SELECT ?lat ?lon WHERE {" + // only one language
    esc(dbpediaID(topic)) + " geo:lat ?lat ; " +
    " geo:long ?lon . " +
  "} limit 1";
  sparqlSelect(query, function(result) {
    var lat = result.lat.value;
    var lon = result.lon.value;
    ddebug("lat,lon " + lat + "," + lon);
    if (lat && lon) {
      resultCallback(lat, lon);
    } else {
      errorCallback("No location found");
    }
  }, errorCallback);
}

function loadContentPage(url, title) {
  ddebug("open URL " + url);
  var iframe = Ext.create('Ext.Component', {
    autoEl: {
        tag: 'iframe',
        src: url,
    }
  });
  var pane = Ext.getCmp("content-pane");
  pane.setTitle(title);
  pane.removeAll(); // clear
  pane.add(iframe);
}
