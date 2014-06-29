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
  var uninav = Ext.create('Ext.Component', {
    autoEl: {
        tag: 'iframe',
        src: "../uninav/uninav.html",
    }
  });
  /*var activities = Ext.create('Ext.tab.Panel', {
        width: '100%',
        height: '100%',
        activeTab: 0,
        items: [{
          title: "Learn",
          html: "foo"
        },{
          title: "Explore",
          html: "foo"
        }],
  });*/
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
        //items: [ activities ], // TODO breaks layout
        width: 200,
        height: '100%',
        collapsible: true,
        split: true,
        layout: 'fit'
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
        xtype: 'container',
        title: "Content",
        id: "content-pane",
        layout: 'fit'
    }],
  });
}
