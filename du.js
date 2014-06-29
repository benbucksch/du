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
  document.getElementById("title").textContent = topic.title;
}

Ext.application({
    name : "Digital Universe",
    launch : function() {
      createUI();
    },
});

function createUI() {
  Ext.create('Ext.Panel', {
    renderTo     : Ext.getBody(),
    width        : 200,
    height       : 150,
    bodyPadding  : 5,
    title        : "Digital Universe",
    html         : "test",
  });
}
