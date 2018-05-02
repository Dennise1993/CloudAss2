
let TweetConfigAjax = (supperclass) => class extends supperclass {
    constructor(){
        super();
        console.log('tweet config constrctor');
        this.URLs = {
            'Australia': 
                {
                    'Number of Tweets': ''
                },
            'Melbourne': 
                {
                    'Politics': '',
                    'Sentiment': '',
                    'Spelling': '',
                    'Number of Tweets': ''
                },
            'Sydney':
                {
                    'Politics': '',
                    'Sentiment': '',
                    'Spelling': '',
                    'Number of Tweets': ''
                }
        };
    }
};

export default TweetConfigAjax;


