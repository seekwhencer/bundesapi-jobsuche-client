import Events from "./EventEmitter.js"

export default class Scheduler extends Events {
    constructor(jobbinger) {
        super();
        this.jobbinger = jobbinger;
    }

    async run(){

    }

    get fetcher() {
        return this.jobbinger.fetcher;
    }
    set fetcher(value) {
        //
    }

    get server() {
        return this.jobbinger.server;
    }
    set server(server) {
        //
    }
}
