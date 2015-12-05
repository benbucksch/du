var app = angular.module('duTopicEditor',[])
.controller("Topic", function($scope) {
  $scope.topic = null;
  $scope.save = save;
  var $scope = topicScope();
  $scope.topic = getCurrentTopicFromFrame();
  $scope.originalTopic = topic; // TODO copy
  $scope.isDirty = true;
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

function save() {
  var $scope = topicScope();
  var originalWebpages = $scope.originalTopic.understand.webpages;
  var webpages = $scope.topic.understand.webpages;
  var tID = "<" + $scope.topic.lodID + ">"; // topic ID
  var mod = [];
  webpages.forEach(function(page) {
    var org = originalWebpages.filter(function(org) {
      return org.url == page.url;
    })[0];
    var s = "<" + page.url + ">";
    if ( !org) {
      mod.push({ op : "add", s : tID, p : "dmoz:link", o : s }); // new link from topic to url
    }
    if (page.title != org.title) {
      mod.push({ op : org ? "mod" : "add",
          s : page.url, p : "dc:title", o : '"' + page.title + '"' });
    }
    if (page.description != org.description) {
      mod.push({ op : org ? "mod" : "add",
          s : s, p : "dc:description", o : '"' + page.description + '"' });
    }
  });
  originalWebpages.filter(function(org) { // in old
    return webpages.filter(function(page) {
      return org.url == page.url;
    }).length == 0; // not in new
  }).forEach(function(org) {
    // remove link from topic to url
    mod.push({ op : "remove", s : tID, p : "dmoz:link", o : "<" + org.url + ">" });
  });

  console.log(JSON.stringify(mod, null, " "));

  sendChanges(mod, top.gScope.user, function() {
    console.log("done");
  }, errorCritical);
}

function sendChanges(mod, graph, user, successCallback, errorCallback) {
  var w = new Waiter(successCallback, errorCallback);
  w.successAfterError = true;
  mod.forEach(function(m) {
    var method;
    if (m.op == "mod") {
      method = "PUT";
    } else if (m.op == "add") {
      method = "POST";
    } else if (m.op == "remove") {
      method = "DELETE";
    } else {
      throw "unknown operation " + m.op;
    }
    loadURL({
      url : "/api/curator/triple",
      method : method,
      urlArgs : {
        account : user.username,
        password : user.password,
        graph : graph,
        s : m.s,
        p : m.p,
        o : m.o,
      },
    }, successCallback, errorCallback);
  });
}
