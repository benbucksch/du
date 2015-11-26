var app = angular.module('duTopicEditor',[])
.controller("Topic", function($scope) {
})
.controller("Taxonomy", function($scope) {
  // Currently loaded taxonomy
  $scope.rootTopic = null;

  // Menu: File load/save
  $scope.loadURL = window.location.origin + "/uninav/taxonomy.json";
  $scope.onLoadTaxonomyURL = onLoadTaxonomyURL;
  $scope.onLoadTaxonomyFile = onLoadTaxonomyFile;
  $scope.saveTaxonomy = saveTaxonomy;
})
;

app.run(function($rootScope) {
  ddebug("startup");
});

function topicScope() {
  return angular.element(E("topic")).scope();
}
function taxonomyScope() {
  return angular.element(E("tree")).scope();
}

var gTreeView;


function onLoadTaxonomyURL(url) {
  loadTaxonomyJSON(url, resultCallback, errorCallback);
}

function onLoadTaxonomyFile(files) {
  loadTaxonomyFile(files, loadTaxonomyIntoUI, errorCritical);
}

function loadTaxonomyFile(files, resultCallback, errorCallback) {
  if (files.length == 0) {
    return;
  }
  assert(files.length == 1, "Can load only 1 file");
  var file = files[0]; // {File} https://developer.mozilla.org/en/docs/Web/API/File
  // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
  var reader  = new FileReader();
  reader.onloadend = function() {
    var url = reader.result;
    // from uninav/data.js. Takes JSON, returns rootTopic to resultCallback.
    loadTaxonomyJSON(url, resultCallback, errorCallback);
  }
  reader.readAsDataURL(file);
}

function loadTaxonomyIntoUI(rootTopic) {
  taxonomyScope().rootTopic = rootTopic;

  gTreeView = new TreeView(E("treeview"), rootTopic,
  function(topic) { // on select
    ddebug("Switching to topic " + topic.title);
    topicScope().$apply(function($scope) {
      $scope.topic = topic;
    });
  },
  function(parentTopic) { // on expand
  },
  errorCritical);
}

function saveTaxonomy(rootTopic) {
  // from uninav/data.js. Takes rootTopic, returns JSON.
  var json = exportTaxonomyJSON(rootTopic);
  downloadFromVariable(JSON.stringify(json, null, " ") + "\n", "text/json");
}
