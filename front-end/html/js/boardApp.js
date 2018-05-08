


let SA2_Map = '../data/SA2_2016_AUST.json';

let topicData = {
  'Greater Melbourne': {
    'Docklands': 0.1,
    'Melbourne': 0.14,
    'Carlton': 0.19,
    'Altona North': 0.08,
    'Brunswick': 0.2        
  },
  'Greater Sydney': {
    'Mosman': 0.05,
    'Homebush': 0.9,
    'Maroubra': 0.17,
    'Marrickville': 0.11
  }
};
//push value in array
let vArray = [];
for (key in topicData){
  vArray.push(topicData[key]);
}


let svgMap = d3.select('#myMap');
let svgKey = d3.select('#myKey');

let x = d3.scaleLinear()
    .domain([1,10]) //1,10
    .rangeRound([600, 860]);

let rateTopic = d3.scaleLinear()
    .domain(
      [d3.min(vArray, function(d){
      return d;
    }),d3.max(vArray, function(d){
      return d;
    })])
    .rangeRound([600, 860]);

let rateY = d3.scaleLinear()
    .domain(
      [d3.min(vArray, function(d){
      return d;
    }),d3.max(vArray, function(d){
      return d;
    })])
    .range([2,9]);

//console.log(rateY.range());

let color = d3.scaleThreshold()
    .domain(d3.range(2, 10))//2,10
    .range(d3.schemeOrRd[9]);//9

//console.log(color.range());
//TRANSFORM RATE TO COLOR
/*console.log(color(rateY(190)));*/
/*let arr = d3.range(110,200,(200-110)/9);*/
//console.log(arr);

var g = svgKey.append("g")
    .attr("class", "key")
    .attr("transform", "translate(-400,20)");

g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

//key's title 
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("ratio Junk food word");


    g.call(d3.axisBottom(rateTopic)
        .tickSize(13)
        .tickFormat(function(y, i) { 
          //return i ? x : x + "%"; 
          return y;
        })
        .tickValues([d3.min(vArray, function(d){
          return d;
        }),d3.max(vArray, function(d){
          return d;
        })]))
      .select(".domain")
        .remove();

//The way used to generating the Australia map
let projection = d3.geoMercator()
    .scale(26000)
    .translate([-68000,-16000])
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
let path = d3.geoPath()
    .projection(projection);

d3.queue()
  .defer(d3.json, SA2_Map)
  .await(ready);

function ready(error, aus){
  if(error) throw error;

  svgMap.append('g')
      .attr('class', 'sa2')
    .selectAll('path')
    .data(topojson.feature(aus, aus.objects.SA2_2016_AUST).features)
    .enter().append('path')
      //.attr('fill', '#2171b5')
      
      .attr('fill', function(d){
        let colorDomain;
        let areaName = d.properties.SA2_NAME16;
        if(topicData.hasOwnProperty(areaName)){
          d.rate = topicData[areaName];
          let originRate = d.rate;
          colorDomain = rateY(originRate);
        }else{
          d.rate=' ';
          return '#D3D3D3';        
        }
        return color(colorDomain);
      })     
      .attr('d', path)
    .append('title')
      .text(function(d){
        //alert(d.properties.SA2_NAME16)
        let str = 'name: '+ d.properties.SA2_NAME16 +' value: '+d.rate;
        return str;
      });

}

//load Australia map TODO: load data from CouchDB later on
/*let promises = [
  d3.json(govFilePath),
  d3.json(stateFilePath)
];

Promise.all(promises).then((d) => {
  ready(d)
}).catch((e) => {
  console.log(e)
});

function ready(files){

  svgMap.append("g")
      .attr("class", "local-gov")
    .selectAll("path")
    .data(files[0].features)
    .enter().append("path")
      .attr("fill", '#2171b5')
      .attr('id',function(d){return d.id})
      .attr("d", path);

}
*/





