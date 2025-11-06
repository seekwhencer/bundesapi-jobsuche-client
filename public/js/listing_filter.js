import EventEmitter from "./event_emitter.js";

export default class ListingFilter extends EventEmitter {
    constructor() {
        super();

        this.query = new Proxy({}, {
            get: (target, prop, receiver) => {
                return target[prop];
            },

            set: (target, prop, value) => {
                if(target[prop] === value)
                    return true;

                target[prop] = value;

                this.emit('update', prop, value);
                this.emit(prop, value);
                return true;
            }
        });
    }
}