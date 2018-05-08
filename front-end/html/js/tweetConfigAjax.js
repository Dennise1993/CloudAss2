
let TweetConfigAjax = (supperclass) => class extends supperclass {
    constructor(){
        super();
        console.log('tweet config constrctor');
        this.URLs = {
            'Politics': '/political-ratio-suburb',
            'Sentiment': '/sentiment-suburb',
            'Junk Food': '/junk-food-ratio-suburb',
            'Device': '/popular-device-suburb'                
        };
    }
};

export default TweetConfigAjax;


