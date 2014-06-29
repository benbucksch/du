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
