var app = angular.module('duTopicEditor',[])
.controller("Topic", function($scope) {
})
;

app.run(function($rootScope) {
  ddebug("startup");
});

function topicScope() {
  return angular.element(E("topic")).scope();
}

var gTreeView;

function openTaxonomyURL() {
  var url = window.prompt("URL for taxonomy JSON", "Load taxonomy");
  if ( !url) {
    return;
  }
  loadTaxonomyIntoUI(url);
}

function openTaxonomyFile(files) {
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
      alert("Showing " + topic.title);
      topicScope().topic = topic;
    },
    function(parentTopic) { // on expand
    },
    errorCritical);
  }, errorCritical);
}
