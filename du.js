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
  Ext.getCmp("content-pane").setTitle(topic.title);
  loadActivityLearn(topic);
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

function esc(str) {
  // TODO
  return str
    .replace(/\&/g, "and")
    .replace(/\"/g, "'")
    .replace(/ /g, "_");
}

function sparqlSelect(query, resultCallback, errorCallback) {
  var query = "SELECT ?abstract WHERE {" +
    query + " . " +
    "filter(langMatches(lang(?abstract), 'en'))" +
  "} limit 1";
  loadURL({
    url : "http://sparql.manyone.zone/sparql",
    urlArgs : {
      query : query,
      format : "application/sparql-results+json",
      callback : "load",
    },
    dataType : "json",
  }, function(json) {
    resultCallback(json.results.bindings[0]);
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
}

function loadActivityLearn(topic) {
  var title = topic.title
      .replace(/ \&.*/g, "") // HACK: With "A&B", take only A
      .replace(/, .*/g, ""); // HACK: With "A, B & C", take only A
  title = title[0] + title.substr(1).toLowerCase(); // Double words in lowercase
  var subjectID = topic.subjects && topic.subjects[0] || "dbpedia:" + title;

  Ext.getCmp("content-pane").removeAll(); // clear old content
  sparqlSelect(esc(subjectID) + " dbpedia-owl:abstract ?abstract", function(result) {
    var abstract = result.abstract.value;
    assert(abstract, "No abstract found for: " + topic.title);
    Ext.getCmp("content-pane").update(abstract); // sets content
  }, errorCritical);
}

function loadActivityUnderstand(topic) {
  var title = topic.title
      .replace(/ \&.*/g, "") // HACK: With "A&B", take only A
      .replace(/, .*/g, "") // HACK: With "A, B & C", take only A
      .replace(/ /g, "_");
  title = title[0] + title.substr(1).toLowerCase(); // Double words in lowercase

  loadContentPage(
      "http://en.m.wikipedia.org/wiki/" + encodeURIComponent(title),
      "Understand " + topic.title);
}

function loadActivityWatch(topic) {
  loadContentPage(
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(topic.title),
      "Watch " + topic.title + " movies");
}

function loadActivityCreate(topic) {
  var domain = topic.title.replace(/[ \&\,]*/g, "").toLowerCase() + "expert.org";
  var linktext = "Register " + domain + " now";
  var url = "http://www.securepaynet.net/domains/search.aspx?prog_id=473220&domainToCheck=" + domain + "&tld=.org&checkAvail=1";
  loadContentPage(url, "Create the " + topic.title + " portal");
}

function loadActivityNews(topic) {
  loadContentPage(
      "http://" + gSite + "/activity-news.php",
      topic.title + " News");
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
