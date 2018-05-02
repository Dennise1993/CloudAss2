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

		this.areaTopic=['Australia', 'Number of Tweets'];

		this.render();
	}

	loadTopic(e){
		//build a new array then fill area and topic
		//compare if two arrays are same
			//if not then call api
			//if not change the title
			//if not then check area is australia or not
				//if not, show '#other-topics'
				//if yes, hide '#other topics'
		let topic = $(e.target).data('topic');
		if(this.areaTopic[1]!==topic){
			this.areaTopic[1]=topic;
			this.render();
		}		
	}

	loadArea(e){
		let area = $(e.target).data('area');
		if(this.areaTopic[0]!==area){
			this.areaTopic[0]=area;
			this.render();
		}
		
	}

	loadStatics(){

	}

	loadGraph(){
		console.log('load graph');
	}

	render(){
		console.log('render page');
		//render title
		
		if(this.areaTopic[0]==='Australia'){
			this.areaTopic[1]='Number of Tweets';
			this.otherTopics.hide();
			this.graphContent.hide();
			console.log(this.graphContent);
		}else{
			this.otherTopics.show();
			this.graphContent.show();
		}
		this.title.empty().append(this.areaTopic[0]+' > '+this.areaTopic[1]);
		//TODO:render map and graphs
	}
}

CloudApp.eles = {
	body: 'body',
	title: '.js-title',
	map: '.js-map',
	graphContent: '#js-graph-content',
	otherTopics: '#other-topics'

};
CloudApp.eventMap = {
	"click .js-area a": "loadArea",
	'click .js-topic a': 'loadTopic',
	'click .js-sub-topic button': 'loadGraph'
};

export default CloudApp;

