
class DiagramUtils {
  constructor ( mapLoc, keyLoc, graphLoc){
    this.mapFile = '../data/SA2_2016_AUST.json'; /* '../data/SA2_2016_AUST.json' */
    this.svgMap = d3.select(mapLoc); //'#myMap'
    this.svgKey = d3.select(keyLoc); //'#myKey'
    this.graph = d3.select(graphLoc);
    
    this.keyTitleMap = {
      'Sentiment': 'average sentiment',
      'Politics': 'ratio political',
      'Junk Food': 'ratio junk food word',
      'Device': 'most devices used'
    };

    this.subTopicsData = subTopicsData;
  }

  drawDiagramArea(topicData, topic, area, subTopic){

    if(this.keyTitleMap.hasOwnProperty(topic)){
      this.keyTitle = this.keyTitleMap[topic];
    }else{
      this.keyTitle = null;
    }    

    this.topic = topic;
    this.area = area;

    let resultData;
    if(area === 'Melbourne'){
      resultData = topicData['Greater Melbourne'];
    }else{
      resultData = topicData['Greater Sydney'];
    }

    this.topicData = resultData;
    //push value in array
    this.xs = [];
    for (let key in this.topicData){
      this.xs.push(this.topicData[key]);
    }

    this.drawScale();
    this.drawMap();
    this.drawGraph(subTopic);
  }


  drawScale(){
    let x = d3.scaleLinear()
        .domain([1,10])
        .rangeRound([600, 860]);

    let rateTopic = d3.scaleLinear()
        .domain(
          [d3.min(this.xs, function(d){
          return d;
        }),d3.max(this.xs, function(d){
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
        .tickValues([d3.min(this.xs, function(d){
          return d;
        }),d3.max(this.xs, function(d){
          return d;
        })])
        )
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
          [d3.min(this.xs, function(d){
          return d;
        }),d3.max(this.xs, function(d){
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
              let str = d.properties.SA2_NAME16 +' '+d.rate;
              return str;
            });         
      });
  }

  parseJson(d,topicK, areaK){
    let suburb, value;
    for(let f of d.features){
      suburb = f.properties[areaK];
      value = f.properties[topicK];
      this.subTopicsData[this.area][this.subTopic][suburb] = value;
    }
    //console.log('parseDraw: ');
    //console.log(this.subTopicsData[this.area][this.subTopic]);    
  }

  drawScatter(showData){
    let _this = this;
    console.log('draw scatter')
    let margin = {top: 40,right: 20,bottom: 60,left: 60},
    width = 800,
    height = 450;

    const tooltip = this.graph.append('div')
      .attr('id', 'tooltip');

    const x = d3.scaleLinear()
      .range([0, width]);

    const y = d3.scaleLinear()
      .range([height, 0]);

    const chart = d3.select('#chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

      //Add title
    chart.append('text')             
      .attr('transform', `translate(${width/2},${margin.top - 54})`)
      .attr('id', 'title')
      .text('Relationship between '+ this.topic +' and '+ this.subTopic + ' in '+ this.area);
  
    x.domain([d3.min(this.xs, (d) => d), d3.max(this.xs, (d) => d)]);
    y.domain([d3.min(this.ys, (d) => d), d3.max(this.ys, (d) => d)]);
  
    chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(7));
    
    chart.append('text')             
      .attr('transform', `translate(${width/2},${height + margin.top})`)
      .attr('id', 'x-label')
      .text(this.topic);

    chart.append('g')
      .call(d3.axisLeft(y).ticks(7));
  
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('dx', '-20em')
      .attr('dy', '-2.5em')
      .text(this.subTopic);
  /*
    chart.append('circle')
      .attr('cx', '600')
      .attr('cy', '400')
      .attr('r', '5')
      .style('fill', '#C13522');
  
    chart.append('text')
      .attr('x', '610')
      .attr('y', '405')
      .text('Allegations of Doping');
  
    chart.append('circle')
      .attr('cx', '600')
      .attr('cy', '430')
      .attr('r', '5')
      .style('fill', '#225FC1');
  
    chart.append('text')
      .attr('x', '610')
      .attr('y', '435')
      .text('No Doping Allegations');
  */
    chart.selectAll('.circle')
      .data(showData)
      .enter().append('circle')
      .attr('class','circle')
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .attr('r', 2)
      //.style('fill', (d) => d.Doping.length > 2 ? '#C13522' : '#225FC1')
      /*
      .on('mouseover', (d) => {
        tooltip.transition()
          .duration(100)    
          .style('opacity', .9);
        tooltip.text(d.name + ' ' + this.topic + ': ' + d.x+', '+ this.subTopic+': '+d.y)
          .style('left', `${d3.event.pageX + 2}px`) 
          .style('top', `${d3.event.pageY - 18}px`);
      })
      .on('mouseout', () => {   
        tooltip.transition()    
        .duration(400)    
        .style('opacity', 0); 
      });
      */
      .append('title')
            .text(function(d){
              //alert(d.properties.SA2_NAME16)
              let str = d.name + ' (' + _this.topic + ': ' + d.x+', '+ _this.subTopic+': '+d.y+')'
              return str;
            }); 
    
  }

  readyScatter(){
    let subTopicData = this.subTopicsData[this.area][this.subTopic];
    let showData= [];
    this.ys = [];
    for(let suburb in subTopicData){
      if(this.topicData.hasOwnProperty(suburb)){
        let x = this.topicData[suburb];
        let y = subTopicData[suburb];
        showData.push({
          'name': suburb, 
          'x': x,
          'y': y
        });
        this.ys.push(y);
      }
    }

    //console.log('drawScatter: ');
    //console.log(showData);
    this.drawScatter(showData);
  }

  parseDraw(d,topicK, areaK){
    this.parseJson(d,topicK, areaK);
    this.readyScatter();
  }

  drawGraph(subTopicK){
    this.subTopic = subTopicK;
    let _this = this;
    let subTopic = subTopicsMap[this.area][this.subTopic];
    let fileN = subTopic.fileName;

    d3.json(fileN, (e, d)=>{
          if(e) throw e;
          _this.parseDraw(d, subTopic.topicKey, subTopic.areaKey);
        });
  }
}

let subTopicsMap = {
  Melbourne: {
    Age: {
      fileName: '../data/Melbourne/ageIncome.json',
      topicKey: 'Median_age_persons',
      areaKey: 'SA2_NAME11'
    },
    Education: {
      fileName: '../data/Melbourne/education.json',
      topicKey: 'psq_bach_deg_%',
      areaKey: 'sa2_name_2011'
    },
    Income: {
      fileName: '../data/Melbourne/ageIncome.json',
      topicKey: 'Median_Tot_prsnl_inc_weekly',
      areaKey: 'SA2_NAME11'
    },
    Health: {
      fileName: '../data/Melbourne/highchol.json',
      topicKey: 'hg_choles_me_2_rate_3_11_7_13',
      areaKey: 'area_name'
    }
  },
  Sydney: {
    Age: {
      fileName: '../data/Sydney/ageIncome.json',
      topicKey: 'Median_age_persons',
      areaKey: 'SA2_NAME11'
    },
    Education: {
      fileName: '../data/Sydney/education.json',
      topicKey: 'psq_bach_deg_%',
      areaKey: 'sa2_name_2011'
    },
    Income: {
      fileName: '../data/Sydney/ageIncome.json',
      topicKey: 'Median_Tot_prsnl_inc_weekly',
      areaKey: 'SA2_NAME11'
    },
    Health: {
      fileName: '../data/Sydney/highchol.json',
      topicKey: 'hg_choles_me_2_rate_3_11_7_13',
      areaKey: 'area_name'
    }
  }      
};

let subTopicsData = {
  Melbourne: {
    Age: {},
    Education: {},
    Income: {},
    Health: {}
  },
  Sydney: {
    Age: {},
    Education: {},
    Income: {},
    Health: {}
  }
};

export default DiagramUtils;
