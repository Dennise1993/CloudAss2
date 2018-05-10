
let BaseAjax = (supperclass) => class extends supperclass {
    constructor() {
        super();
        console.log('base ajax constrctor');
    }

    _getCall(urlAddr) {
        return $.get();
    }

    callAjax(urlAddr, successCallBack, failCallBack) {
        this._getCall(urlAddr)
            .done(function (d) {              
                successCallBack(d);
                console.log("call " + urlAddr+ " successful.");
                
            })
            .fail(function (e) {
                console.log(e);
                failCallBack();
            });
    }
};

export default BaseAjax;


