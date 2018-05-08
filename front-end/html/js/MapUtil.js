/*
let topicData = {
  'Docklands': 0.1,
  'Melbourne': 0.14,
  'Carlton': 0.19,
  'Altona North': 0.08,
  'Brunswick': 0.2
};
*/

class MapUtils {
  constructor ( mapLoc, keyLoc){
    this.mapFile = '../data/SA2_2016_AUST.json'; /* '../data/SA2_2016_AUST.json' */
    this.svgMap = d3.select(mapLoc); //'#myMap'
    this.svgKey = d3.select(keyLoc); //'#myKey'
    
    this.keyTitleMap = {
      'Sentiment': 'average sentiment',
      'Politics': 'ratio political',
      'Junk Food': 'ratio junk food word',
      'Device': 'most devices used'
    };
  }

  drawMapArea(topicData, topic, area){

    if(this.keyTitleMap.hasOwnProperty(topic)){
      this.keyTitle = this.keyTitleMap[topic];
    }else{
      this.keyTitle = null;
    }    

    this.area = area;
    let resultData;
    if(area === 'Melbourne'){
      resultData = topicData['Greater Melbourne'];
    }else{
      resultData = topicData['Greater Sydney'];
    }

    this.topicData = resultData;
    //push value in array
    this.vArray = [];
    for (let key in this.topicData){
      this.vArray.push(this.topicData[key]);
    }

    this.drawScale();
    this.drawMap();
  }

  drawScale(){
    let x = d3.scaleLinear()
        .domain([1,10])
        .rangeRound([600, 860]);

    let rateTopic = d3.scaleLinear()
        .domain(
          [d3.min(this.vArray, function(d){
          return d;
        }),d3.max(this.vArray, function(d){
          return d;
        })])
        .rangeRound([600, 860]);    

    let color = d3.scaleThreshold()
        .domain(d3.range(2, 10))//2,10
        .range(d3.schemeOrRd[9]);//9

    //locat scale line
    let g = this.svgKey.append("g")
        .attr("class", "key")
        .attr("transform", "translate(-400,20)");

    //fill color into scale line
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
        .text(this.keyTitle);

    //draw ticks
    g.call(d3.axisBottom(rateTopic)
        .tickSize(13)
        .tickFormat(function(y, i) { 
          //return i ? x : x + "%"; 
          return y;
        })
        .tickValues([d3.min(this.vArray, function(d){
          return d;
        }),d3.max(this.vArray, function(d){
          return d;
        })]))
      .select(".domain")
        .remove();

  }

  drawMap(){
    let _this = this;

    let color = d3.scaleThreshold()
      .domain(d3.range(2, 10))//2,10
      .range(d3.schemeOrRd[9]);//9

    let rateY = d3.scaleLinear()
        .domain(
          [d3.min(this.vArray, function(d){
          return d;
        }),d3.max(this.vArray, function(d){
          return d;
        })])
        .range([2,9]);

    //The way used to generating the Australia map
    let s = 26000,
      prec = 10,
      tran;

    if(this.area === 'Melbourne'){
      tran = [-65200,-18300];
    } else {
      tran = [-68000,-16000];
    }

    let projection = d3.geoMercator()
        .scale(s)
        .translate(tran)
        .precision(prec);

    let path = d3.geoPath()
        .projection(projection);

    d3.queue()
      .defer(d3.json, this.mapFile)
      .await((error, aus)=>{

        if(error) throw error;

        this.svgMap.append('g')
            .attr('class', 'sa2')
          .selectAll('path')
          .data(topojson.feature(aus, aus.objects.SA2_2016_AUST).features)
          .enter().append('path')
            .attr('fill', function(d){
              let colorDomain;
              let areaName = d.properties.SA2_NAME16;
              if(_this.topicData.hasOwnProperty(areaName)){
                d.rate = _this.topicData[areaName];
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
      });

  }

};

export default MapUtils;
