
let TweetConfigAjax = (supperclass) => class extends supperclass {
    constructor(){
        super();
        console.log('tweet config constrctor');
        this.URLs = {
            'Politics': '',
            'Sentiment': '',
            'Junk Food': '',
            'Device': ''               
        };
    }
};

export default TweetConfigAjax;


