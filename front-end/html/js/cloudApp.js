import Base from './base.js';
import TweetConfigAjax from './tweetConfigAjax.js';
import BaseAjax from './baseAjax.js';

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

	renderMap(){
		let area = this.areaTopic[0];
		let topic = this.areaTopic[1];
		console.log('render map: area:'+ area+', topic: '+topic);
		//
	}
	renderGraph(){
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
		//TODO:render map and graphs
		this.renderMap();
		this.renderGraph();
	}
}

CloudApp.eles = {
	body: 'body',
	title: '.js-title',
	map: '.js-map',
	graphContent: '#js-graph-content',
	subTopicArea: '.js-sub-topic',
	subTab: '.js-sub-tab'
};
CloudApp.eventMap = {
	"click .js-area a": "loadArea",
	'click .js-topic a': 'loadTopic',
	'click .js-sub-topic button': 'loadGraph'
};

export default CloudApp;

