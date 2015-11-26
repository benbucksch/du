/**
 * Creates a TreeView UI widget.
 * Populates lazy. This allows large trees and even
 * multiple parents.
 *
 * @el {DOMElement} the tree widget, empty <div>
 * @rootNode {Node} the model
 * Node = {
 *   title {string},
 *   iconURL {URL as string},
 *   children : {Array of Node},
 * }
 * @onSelect {function(node {Node})} Called when the
 *   user clicks on a node label/icon, to select it.
 * @onExpand {function(node {Node})} Called when the
 *   user clicks on the [+] icon to expand a node.
 *   This is a good place for you to fill in subnodes
 *   (lazy population).
 * @errorCallback {function(e {Exception})} Called when
 *   there's a serious problem in the widget, or when your
 *   callbacks throw.
 */
function TreeView(el, rootNode, onSelect, onExpand, errorCallback) {
  assert(el && el.nodeType == 1, "Need DOM element");
  assert(typeof(onSelect) == "function", "Need onSelect event handler");
  assert(typeof(onExpand) == "function", "Need onOpen event handler");
  assert(typeof(errorCallback) == "function", "Need error callback");
  cleanElement(el);
  this.widgetE = el;
  el.classList.add("treeview");
  this.rootNode = rootNode;
  this.onSelect = onSelect;
  this.onExpand = onExpand;
  this.errorCallback = errorCallback;

  var rootE = this.render(rootNode, this.widgetE);
  try {
    this.onSelect(rootNode);
    this.expand(rootNode, rootE);
  } catch (e) { errorCallback(e); }
}
TreeView.prototype = {
  render : function(node, parentE) {
    var nodeE = cE("div", "node");
    nodeE.node = node;

    // open/close button
    var openCloseE = cE("div", "openclose");
    if (node.children.length == 0) {
      nodeE.classList.add("empty");
    }
    nodeE.appendChild(openCloseE);

    // icon
    var iconE = cE(node.iconURL ? "img" : "div", "icon", {
      src : node.iconURL,
    });
    nodeE.appendChild(iconE);
    parentE.appendChild(nodeE);

    // label
    var labelE = cE("span", "label");
    labelE.appendChild(cTN(node.title));
    nodeE.appendChild(labelE);

    // event handlers
    var self = this;
    openCloseE.addEventListener("click", function(event) {
      try {
        event.stopPropagation();
        if (nodeE.classList.contains("empty")) {
          return;
        }
        if (nodeE.classList.contains("open")) {
          self.shrink(node, nodeE);
        } else {
          self.expand(node, nodeE);
        }
      } catch (e) { self.errorCallback(e); }
    }, false);

    nodeE.addEventListener("click", function(event) {
      try {
        event.stopPropagation();
        self.onSelect(node);
      } catch (e) { self.errorCallback(e); }
    }, false);

    return nodeE;
  },
  expand : function(node, nodeE) {
    assert(nodeE.classList.contains("node"), "Need node DOM element");
    var self = this;
    this.loadChildren(node, nodeE);
    // fetch grandchildren as well, to know whether to show [+] or nothing
    node.children.forEach(function(childNode) {
      self.loadChildren(childNode);
    });

    nodeE.classList.add("open");

    if ( !nodeE.querySelector(".children")) { // No node DOM children
      // populate UI
      var childrenE = cE("div", "children");
      nodeE.appendChild(childrenE);
      node.children.forEach(function(childNode) {
        self.render(childNode, childrenE);
      });
    } else {
      nodeListToArray(nodeE.querySelector(".children").childNodes).forEach(function(childE) {
        childE.classList.remove("hidden");
      });
    }
  },
  shrink : function(node, nodeE) {
    assert(nodeE.classList.contains("node"), "Need node DOM element");
    nodeE.classList.remove("open");
    nodeListToArray(nodeE.querySelector(".children").childNodes).forEach(function(childE) {
      childE.classList.add("hidden");
    });
  },
  loadChildren : function(node) {
    if (this._childrenLoaded) {
      return;
    }
    this.onExpand(node); // call model
    node._childrenLoaded = true;
  },
}
