//size of map
var width = 960;
var height = 680;
var stateFilePath = 'au-states.geojson.json';
var govFilePath = 'au-states.geojson.json aus_lga.geojson.json';

var svg = d3.select('body').append('svg')
	.attr('width', width)
	.attr('height', height);

//The way used to generating the Australia map
var projection = d3.geo.mercator()
    .scale(900)
    .translate([-1600,-100])
    .precision(10);

var path = d3.geo.path()
    .projection(projection);

//load Australia map TODO: load data from CouchDB later on
var promises = [
	d3.json(govFilePath),
	d3.json(stateFilePath)
];

Promise.all(promises).then((d) => {
	ready(d)
}).catch((e) => {
	console.log(e)
});

function ready(files){

	svg.append("g")
      .attr("class", "local-gov")
    .selectAll("path")
    .data(files[0].features)
    .enter().append("path")
      .attr("fill", '#2171b5')
      .attr('id',function(d){return d.id})
      .attr("d", path)

}

