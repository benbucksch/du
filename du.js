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
  /*var uninav = Ext.create('DU.UniNav', {
        region: 'north',
        title: "UniNav",
        id: "uninav-pane",
        layout: 'fit',
        height: 200,
        width: '100%',
        margin: '0 0 0 0'
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
        width: 200,
        height: '100%',
        collapsible: true,
        split: true,
        layout: 'fit'
    },{
        region: 'north',
        //xtype: 'DU.UniNav',
        xtype: 'panel',
        title: "UniNav",
        id: "uninav-pane",
        height: 200,
        width: '100%',
        split: true,
        layout: 'fit'
    },{
        region: 'center',
        xtype: 'panel',
        title: "Content",
        id: "content-pane",
        layout: 'fit'
    }],
  });

  /*Ext.create('DU.UniNav', {
    renderTo     : Ext.getBody(),
  });*/
}
Ext.ns('DU');
Ext.define('DU.UniNav', {
     extend: 'Ext.ux.IFrame',
     //alias: '',
     height: 200,
     title: "Topics",
     src: "../uninav/uninav.html",
 });
