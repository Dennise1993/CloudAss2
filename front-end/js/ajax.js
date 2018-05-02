
let baseAjax = (supperclass) => class extends supperclass {
    constructor() {
        super();
    }

    _getCall(urlAddr) {
        return $.get();
    }

    callAjax(urlAddr, successCallBack, failCallBack) {
        this._getCall(urlAddr)
            .done(function (d) {
                if (d.status === "success") {
                    successCallBack(d.result);
                    console.log("call " + urlAddr+ " successful.");
                } else {
                    cosole.log(d);
                    failCallBack();
                }
            })
            .fail(function (e) {
                console.log(e);
                failCallBack();
            });
    }
};

export default baseAjax;


