export default class Logger {
    constructor(jobbinger) {
        this.label = 'LOGGER';
        this.jobbinger = jobbinger;
    }

    log() {
        if (global.DEBUG === false) {
            return false;
        }
        console.log.apply(console, Array.from(arguments));
        this.jobbinger.logger.sendWS(Array.from(arguments));
    }

    error() {
        if (global.DEBUG === false) {
            return false;
        }
        console.error.apply(console, Array.from(arguments));
        this.jobbinger.logger.sendWS(Array.from(arguments));
    }

    sendWS(args) {
        const message = args.join(' ');
        this.server.sendWS({message: message});
    }

    get server() {
        return this.jobbinger.server;
    }

    set server(server) {
        //
    }
}