var app = angular.module('duTopicEditor',[])
.controller("Topic", function($scope) {
  $scope.topic = null;
  $scope.saveModification = saveModification;
  $scope.saveNew = saveNew;
  var params = parseURLQueryString(window.location.search);
  if (params.mode == "new") {
    newTopic();
  } else if (params.mode == "edit") {
    loadFromFrame();
  } else {
    throw "Unknown mode, please pass e.g. mode=new";
  }
})
;

app.run(function($rootScope) {
  ddebug("startup");
});

function getCurrentTopicFromFrame() {
  return top.gScope.topic;
}

function topicScope() {
  return angular.element(E("topic")).scope();
}

function loadFromFrame() {
  var $scope = topicScope();
  $scope.topic = getCurrentTopicFromFrame();
  $scope.originalTopic = topic; // TODO copy
  $scope.isDirty = true;
}

function newTopic() {
  var $scope = topicScope();
  var parent = getCurrentTopicFromFrame();
  var newID = parent.categoryPath + "/dummy";
  var topic = new top.uninav.LODTopic(newID, parent.graphID);
  topic.addToParent(parent);
  topic.title = "Insert title here";
  $scope.topic = topic;
  $scope.isNew = true;
  $scope.isDirty = true;
}

function saveNew() {
  var $scope = topicScope();
  var t = $scope.topic;
  t.id = t.lodID = t.parent.categoryPath + "/" +
      esc(t.title.replaceAll(" ", "_").replaceAll("/", "_"));
  var triples = t.saveTriples(true);
}

function saveModification() {
  var $scope = topicScope();
  var o = $scope.originalTopic;
  var t = $scope.topic;
  var s = "<" + t.lodID + ">";
  var mod = [];
  if (t.title != o.title) {
    mod.push({ s : s, p : "dc:title", o : '"' + t.title + '"' });
  }
  if (t.description != o.description) {
    mod.push({ s : s, p : "dc:description", o : '"' + t.description + '"' });
  }
  if (t.iconURL != o.iconURL) {
    mod.push({ s : s, p : "foaf:img", o : '"' + t.iconURL + '"' });
  }
  if (t.descriptionURL != o.descriptionURL) {
    mod.push({ s : s, p : "du:descriptionPage", o : '"' + t.descriptionURL + '"' });
  }
  if (t.exploreURL != o.exploreURL) {
    mod.push({ s : s, p : "du:explorePage", o : '"' + t.exploreURL + '"' });
  }

  console.log(JSON.stringify(mod, null, " "));
}

/*
function saveModification() {
  var $scope = topicScope();
  var topic = $scope.topic;
  var originalTopic = $scope.originalTopic;
  var newTriples = topic.saveTriples(false);
  var originalTriples = originalTopic.saveTriples(false);
  var diff = diffTriples(originalTriples, newTriples);

  console.log(JSON.stringify(diff, null, " "));
}

function diffTriples(originalTriples, newTriples) {
  var result = {
    addedTriples : [],
    removedTriples : [],
    modifiedTriples : [],
  }
  newTriples.forEach(function(newTriple) {
    if ( !(newTriple.o) &&
        originalTriples.filter(function(orgTriple) {
          return newTriple.s == orgTriple.s && newTriple.p == orgTriple.p;
        }).length > 0) {
      result.removedTriples.push(newTriple);
    }
    var orgSP = originalTriples.filter(function(orgTriple) {
      return newTriple.s == orgTriple.s &&
          newTriple.p == orgTriple.p;
    });
    if (orgSP.length == 1) {
      result.modifiedTriples.push(newTriple);
    } else { // org had 0 or > 1
      result.addedTriples.push(newTriple);
    }
  });
  result.removedTriples = originalTriples.forEach(function(orgTriple) {
    return newTriples.filter(function(newTriple) {
      return newTriple.s == orgTriple.s &&
          newTriple.p == orgTriple.p; // TODO test this for correctness
    }).length == 0;
  });
  return result;
}
*/