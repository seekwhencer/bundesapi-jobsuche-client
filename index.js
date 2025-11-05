#!/usr/bin/env node
import './lib/Utils.js';
import Fetcher from './lib/Fetcher.js';
import Server from './lib/Server.js';

const fetcher = new Fetcher();
const server = new Server(fetcher);

server.run();
