
let TweetConfigAjax = (supperclass) => class extends supperclass {
    constructor(){
        super();
        console.log('tweet config constrctor');
        this.URLs = {
            'Politics': '/political-ratio-suburb',
            'Sentiment': '/sentiment-suburb',
            'Spelling': '/correct-spelling-ratio-suburb',
            'Device': '/apple-or-android-device-surburb'                
        };
    }
};

export default TweetConfigAjax;


