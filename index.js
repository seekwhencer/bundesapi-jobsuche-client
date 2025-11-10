#!/usr/bin/env node
import './lib/Utils.js';
import Fetcher from './lib/Fetcher.js';
import Server from './lib/Server.js';
import Scheduler from "./lib/Scheduler.js";
import Logger from './lib/Log.js';

class Jobbinger {
    constructor() {
        this.logger = new Logger(this);
        this.fetcher = new Fetcher(this);
        this.scheduler = new Scheduler(this);
        this.server = new Server(this);
    }

    async run() {
        await this.server.run();
        await this.scheduler.run();
    }
}

const jobbinger = new Jobbinger();
jobbinger.run();