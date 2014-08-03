/**
 * Start a page change to go to another DU topic.
 *
 * This doesn't entirely reload the current page,
 * just changes the content. Called SPA "Single Page Architecture".
 *
 * Currently called directly from uninav iframe.
 * This direction function call works, because it's the same domain.
 * Alternative: events sent via postMessage(), see below.
 */
function openTopic(topic) {
  Ext.getCmp("content-pane").setTitle(topic.title);
  Ext.getCmp("content-pane").update(""); // clear old content

  loadActivityLearn(topic);
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
        layout: 'accordion',
        items: [{
          title: "Learn",
          id: "activity-learn",
        },{
          title: "Explore",
          id: "activity-explore",
        },{
          title: "Discuss",
          id: "activity-discuss",
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
}

function loadActivityLearn(topic) {
  var title = topic.title
      .replace(/ \&.*/g, "") // HACK: With "A&B", take only A
      .replace(/, .*/g, ""); // HACK: With "A, B & C", take only A
  title = title[0] + title.substr(1).toLowerCase(); // Double words in lowercase
  var subjectID = topic.subjects && topic.subjects[0] || "dbpedia:" + title;

  sparqlSelect(esc(subjectID) + " dbpedia-owl:abstract ?abstract", function(result) {
    var abstract = result.abstract.value;
    assert(abstract, "No abstract found for: " + topic.title);
    Ext.getCmp("content-pane").update(abstract); // sets content
  }, errorCritical);
}

function loadActivityCreate(topic) {
  var domain = topic.title.replace(/[ \&\,]*/g, "").toLowerCase() + "expert.org";
  var linktext = "Register " + domain + " now";
  var url = "http://www.securepaynet.net/domains/search.aspx?prog_id=473220&domainToCheck=" + domain + "&tld=.org&checkAvail=1";
  loadContentPage(url);
}

function loadActivityNews(topic) {
  var url = "http://www.libraryoffrance.org/activity-news.php";
  loadContentPage(url);
}

function loadContentPage(url) {
  var iframe = Ext.create('Ext.Component', {
    autoEl: {
        tag: 'iframe',
        src: url,
    }
  });
  Ext.getCmp("content-pane").update(""); // clear
  Ext.getCmp("content-pane").add(iframe);
}

function errorCritical(e) {
  alert(e);
}

function ddebug(msg) {
  alert(msg);
}
