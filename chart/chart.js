/**
 * This lets the user (usually a steward, but can be an advanced end user, too)
 * create a chart interactively, from data he has previously uploaded to
 * our LOD server.
 *
 * The data are generally scalars (numbers) over 1-3 ranges (dimensions).
 * For geo data, you need to use another component.
 *
 * This consists out of 3 modules:
 * - module to select data
 * - module to configure the chart output option
 * - module to actually create the chart
 * Only the last module depends on a certain chart JS library.
 * We currently use ChartJS, but that may change at any time.
 */

function onLoad() {
  onLoadData();
  onLoadConfig();
  onLoadChart();
}
window.addEventListener("load", onLoad, false);

function update() {
  var canvasE = document.getElementById("myChart")
  createChart(canvasE, getData(), getConfig());
}

/*******************************
Select data

We need to interactively build a SPARQL query like:
SELECT * FROM <http://dbpedia.org> WHERE {
  ?city dbpedia-owl:country dbpedia:Germany .
  ?city dbpedia-owl:populationTotal ?population.
  FILTER(?population > 100000).
} ORDER BY ?population LIMIT 20
/*******************************/

function onLoadData() {
  //$("#source-graph").selectmenu();
  var graphs = {
    "http://dbpedia.org": "dbpedia / Wikipedia infoboxes",
    "http://linkedgeodata.org": "OpenStreetMap POIs",
    "http://manyone.org/du/": "ManyOne Steward/science data",
  };
  new Dropdown(E("source-graph")).addOptions(graphs);
}

/**
 * @returns
 */
function getData() {

}


/*******************************/
/* Configure output */
/*******************************/

const config = {
  charttype : "line", // "bar", "pie", "spiderweb",
  // for line:
  curved : true, // if false: sharp edges on the data points
  curvedTension : 0.4,
  showDataPointDot: true, // place a dot at each data point
  pointSize: 4, // radius of the data point
  pointColor: null, // color of the data point
  lineColor: null, // color of the line connecting data points
  fillColor: null, // color of the area between line and bottom of graph
  // for pie:
  filled : true, // if false, it's a doughnut chart
  __end : null
}

function onLoadConfig() {
}

/**
 * @return a |config| object
 */
function getConfig() {
}


/*******************************/
/* Create chart output */
/*******************************/

function onLoadChart() {
}

/**
 * Creates a chart
 *
 * @param domElement {<canvas>}
 * @param data {Object from getData()}
 * @param config {config Object}
 */
function createChart(domElement, data, config) {
  var canvas = domElement.getContext("2d");
  var chart = new Chart(canvas)
  if (config.charttype == "line") {
    chart = chart.Line(data);
  } else if (config.charttype == "bar") {
    chart = chart.Bar(data);
  } else if (config.charttype == "pie") {
    if (config.filled) {
      chart = chart.Pie(data);
    } else {
      chart = chart.Doughnut(data);
    }
  } else if (config.charttype == "spiderweb") {
    chart = chart.Radar(data);
  } else {
    throw new NotReached("Unknown chart type " + config.charttype);
  }
}
