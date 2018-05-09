
    margin = {top: 40,right: 20,bottom: 60,left: 60},
    width = 800,
    height = 600;

    console.log(this.ys);

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
      .call(d3.axisLeft(y).tickValues([1].concat(y.ticks())));
  
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
      .attr('r', 5)
      //.style('fill', (d) => d.Doping.length > 2 ? '#C13522' : '#225FC1')
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




      //x, y axis
    console.log(this.subTopicsData);
    for(let subTopic of this.subTopics){
      console.log('area: '+this.area);
      console.log('subTopic: '+subTopic);
      let subTopicData = this.subTopicsData[this.area][subTopic];
      console.log(subTopicData);
      let showData = { };
      //console.log('subTopicdata ');
      //console.log(subTopicData);
      for(let key in subTopicData){
        console.log('subTopicData key: '+key);
        if(this.topicData.hasOwnProperty(key)){
          let x = this.topicData[key];
          let y = subTopicData[key];
          showData[key] = [x,y];
        }
      }
      this.drawGraph(showData, subTopic);
    } 

    //all graph
      drawAllGraphs(){ 
    /*

    list all aurin files
    read responding files accroding to sub topics 
    then generate 

    this.subTopicsData = 
      {
        Melbourne: {
          'Age': {'Brunswick': 0.02, suburbName2: value2...},
          subtopicName2: subTopicData2, 
          ...
        },
        Sydney: {
          subtopicName1: subTopicData1,
          subtopicName2: subTopicData2, 
          ...
        }
      }

    then loop over the subTopicsData
    and combine the topicData to generate showData to draw the scatterplots
    append them in this.graph one by one

    showData = {
      'Brunswick': [topic, subtopic],
      'Docklands'L [topic, subtopic]
      ...
    }

    */
   
  }

    storeSubTopicsData(){
    let map = DiagramUtils.subTopicsMap;
    let _this = this;
    this.subTopicsData = DiagramUtils.subTopicsData;

    for(let areaK in map){
      for(let subTopicK in map[areaK]){
        let subTopic = map[areaK][subTopicK];
        d3.json(subTopic.fileName, (e, d)=>{
          if(e) throw e;
          _this.parseJson(d, subTopic.topicKey, subTopic.areaKey, subTopicK, areaK);
        });
      }
    }
  }
