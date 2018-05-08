import Base from './base.js';
import TweetConfigAjax from './tweetConfigAjax.js';
import BaseAjax from './baseAjax.js';
import MapUtils from './MapUtil.js';

class CloudApp extends BaseAjax(TweetConfigAjax(Base)){
	constructor(){
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
			'Sydeny':{
				'Sentiment':['Age','Education','Income'],
				'Politics':['Age','Education','Income'],
				'Junk Food':['Age','Income','Health'],
				'Device':['Age','Income']
			}
		};
		this.areaTopic=['Melbourne', 'Sentiment', 'Age'];

		this.mapUtils = new MapUtils('#myMap', '#myKey');
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

	renderMap(topicData){
		this.map.empty();
		this.sclaeLine.empty();

		let area = this.areaTopic[0];
		let topic = this.areaTopic[1];
		console.log('render map: area:'+ area+', topic: '+topic);
		this.mapUtils.drawMapArea(topicData, topic, area);
	}

	renderGraph(){
		this.graph.empty();

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


		this.renderMap(topicData);
		//REMOVE COMMENT AFTER API WORKS
		/*
		let temUrl=null;
		if(this.URLs.hasOwnProperty(topic)){
			temUrl = window.location.href+this.URLs[topic];
		}
		if(temUrl){
			this.callAjax(temUrl, this.renderMap, this.failCallBack);
		} 
		*/
		
		this.renderGraph();
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
	graph: 'js-graph'
};
CloudApp.eventMap = {
	"click .js-area a": "loadArea",
	'click .js-topic a': 'loadTopic',
	'click .js-sub-topic button': 'loadGraph'
};

export default CloudApp;

