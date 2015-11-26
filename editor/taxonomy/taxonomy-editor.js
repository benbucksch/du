var app = angular.module('duTopicEditor',[])
.controller("Topic", function($scope) {
})
.controller("Taxonomy", function($scope) {
  $scope.loadURL = window.location.origin + "/uninav/taxonomy.json";
  $scope.loadTaxonomyFile = loadTaxonomyFile;
  $scope.loadTaxonomyIntoUI = loadTaxonomyIntoUI;
  $scope.saveTaxonomy = saveTaxonomy;
})
;

app.run(function($rootScope) {
  ddebug("startup");
});

function topicScope() {
  return angular.element(E("topic")).scope();
}

var gTreeView;

function loadTaxonomyFile(files) {
  if (files.length == 0) {
    return;
  }
  assert(files.length == 1, "Can load only 1 file");
  var file = files[0]; // {File} https://developer.mozilla.org/en/docs/Web/API/File
  // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
  var reader  = new FileReader();
  reader.onloadend = function() {
    var url = reader.result;
    loadTaxonomyIntoUI(url);
  }
  reader.readAsDataURL(file);
}

function loadTaxonomyIntoUI(url) {
  // from uninav/data.js
  loadTaxonomyJSON(url, function(rootTopic, allByID) {
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
  }, errorCritical);
}

function saveTaxonomy() {
}
