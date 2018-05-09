import Base from './base.js';
import TweetConfigAjax from './tweetConfigAjax.js';
import BaseAjax from './baseAjax.js';
import DiagramUtils from './diagramUtil.js';

class CloudApp extends BaseAjax(TweetConfigAjax(Base)){
	constructor(subTopicsData){
		super();

		this.elements = CloudApp.eles;
		this.eventsMap = CloudApp.eventMap;
		this.initializeElements();
        this.bindEvents();

		this.areaTopicMap = {
			'Melbourne':{
				'Sentiment':['Age','Education','Income'],
				'Politics':['Age','Education','Income'],
				'Junk Food':['Age','Income','Health'],
				'Device':['Age','Income']
			},
			'Sydney':{
				'Sentiment':['Age','Education','Income'],
				'Politics':['Age','Education','Income'],
				'Junk Food':['Age','Income','Health'],
				'Device':['Age','Income']
			}
		};
		this.areaTopic=['Melbourne', 'Sentiment', 'Age'];

		this.diagramUtils = new DiagramUtils('#myMap', '#myKey', '.js-graph');
		this.render();
	}

	loadTopic(e){
		let topic = $(e.target).data('topic');
		//console.log(topic);
		if(this.areaTopic[1]!==topic){
			this.areaTopic[1]=topic;
			this.render();
		}		
	}

	loadArea(e){
		let area = $(e.target).data('area');
		//console.log(area);
		if(this.areaTopic[0]!==area){
			this.areaTopic[0]=area;
			this.render();
		}
	}

	renderDiagram(topicData){
		this.map.empty();
		this.sclaeLine.empty();
		this.chart.empty();
		this.toolTip.empty();

		let area = this.areaTopic[0];
		let topic = this.areaTopic[1];
		let subTopics = this.areaTopicMap[area][topic];
		let subTopic = subTopics[0];
		this.areaTopic[2] = subTopic;
		console.log('render diagram: area:'+ area+', topic: '+topic +' subTopic: ' + subTopic);
		this.diagramUtils.drawDiagramArea(topicData, topic, area, subTopic);

	}

	renderGraph(){
		this.chart.empty();
		this.toolTip.empty();
		this.diagramUtils.drawGraph(this.areaTopic[2]);
		console.log('render graph: '+ this.areaTopic[2]);

	}

	loadGraph(e){
		let subTopic = $(e.target).data('subTopic');
		this.areaTopic[2] = subTopic;
		this.renderGraph();
	}

	render(){

		console.log('render page');
		//render title
		let area = this.areaTopic[0];
		let topic = this.areaTopic[1];
		this.title.empty().append(area +' > '+topic);
		//render sub topic
		let subTopics = this.areaTopicMap[area][topic];

		this.areaTopic[2] = subTopics[0];

		let content = this.subTab.html();
		
		this.subTopicArea.empty();
		let newContent;
		for(let i in subTopics){
			newContent = content.replace(/%data%/g,subTopics[i]);
			this.subTopicArea.append(newContent);
		}
		
		/*
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

		
		this.renderDiagram(topicData);
		
		*/
		

		//REMOVE COMMENT AFTER API WORKS
		
		let temUrl=null;
		let _this = this;
		if(this.URLs.hasOwnProperty(topic)){
			temUrl = window.location.href + ':3000' + this.URLs[topic];
		}
		if(temUrl){
			_this.callAjax(temUrl, _this.renderDiagram, _this.failCallBack);
		} 	
		
	}

	failCallBack(){
		alert('Something wrong, please try again.');
	}
}

CloudApp.eles = {
	body: 'body',
	title: '.js-title',
	map: '.js-map',
	sclaeLine: '.js-key',
	graphContent: '#js-graph-content',
	subTopicArea: '.js-sub-topic',
	subTab: '.js-sub-tab',
	graph: 'js-graph',
	chart: '#chart',
	toolTip: '#tooltip'
};
CloudApp.eventMap = {
	"click .js-area a": "loadArea",
	'click .js-topic a': 'loadTopic',
	'click .js-sub-topic button': 'loadGraph'
};

export default CloudApp;

