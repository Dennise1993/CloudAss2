


var SA2_Map = '../data/SA2_2016_AUST.json';

var svg = d3.select('#myMap');

//The way used to generating the Australia map

var projection = d3.geoMercator()
    .scale(26000)
    .translate([-65200,-18300])
    .precision(10);
/*
sydney
    .scale(26000)
    .translate([-68000,-16000])
    .precision(10);

melbourne
    .scale(26000)
    .translate([-65200,-18300])
    .precision(10);

*/
var path = d3.geoPath()
    .projection(projection);



d3.queue()
  .defer(d3.json, SA2_Map)
  .await(ready);

function ready(error, aus){
  if(error) throw error;

  svg.append('g')
      .attr('class', 'sa2')
    .selectAll('path')
    .data(topojson.feature(aus, aus.objects.SA2_2016_AUST).features)
    .enter().append('path')
      .attr('fill', '#2171b5')
      .attr('d', path)
    .append('title')
      .text(function(d){console.log(d.properties.SA2_NAME16)})

}

//load Australia map TODO: load data from CouchDB later on
/*var promises = [
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
      .attr("d", path);

}
*/





