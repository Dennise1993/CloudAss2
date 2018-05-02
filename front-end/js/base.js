
class Base {

    constructor() {
        console.log('base constrctor');
        this.doc = $(document);   
    }

    bindEvents() {
        this._scanEventsMap(this.eventsMap, true);
    }

    unbindEvents() {
        this._scanEventsMap(this.eventsMap);
    }

    _scanEventsMap(maps, isOn) {
        let delegateEventSplitter = /^(\S+)\s*(.*)$/;
        this.bind = isOn ? this._delegate : this._undelegate;
        for (let keys in maps) {
            if (maps.hasOwnProperty(keys)) {
                let matchs = keys.match(delegateEventSplitter);
                //console.log(maps[keys]);
                this.bind(matchs[1], matchs[2], this[maps[keys]].bind(this));
            }
        } 
    }

    _delegate(name, selector, func) {
        this.doc.on(name, selector, func);
    }

    _undelegate(name, selector, func) {
        this.doc.off(name, selector, func);
    }

    initializeElements() {
        let eles = this.elements;

        for (var name in eles) {
            if (eles.hasOwnProperty(name)) {
                this[name] = $(eles[name]);
            }
        }
    }

    destroy() {
        this.unbindEvents();
    }
}

export default Base;