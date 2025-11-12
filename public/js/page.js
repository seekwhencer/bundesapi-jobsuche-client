import JobDetails from './job_detail.js';
import JobListing from './job_listing.js';
import Searches from './searches.js';
import SearchesFilter from './searches_filter.js';
import JobNameFilter from './jobname_filter.js';
import AgeFilter from "./age_filter.js";
import WebsocketClient from "./websocket.js";

export default class Page {
    constructor() {
        this.jobs = [];
        this.detail = new JobDetails(this);
        this.listing = new JobListing(this);
        this.searches = new Searches(this);
        this.searchesFilter = new SearchesFilter(this);
        this.ageFilter = new AgeFilter(this);
        this.jobNameFilter = new JobNameFilter(this);
        this.ws = new WebsocketClient(this);

        this.toggleDayNighButton = document.querySelector('#toggle-day-night');
        this.toggleDayNighButton.onclick = () => this.toggleDayNight();
    }

    async init() {
        await page.listing.load();
    }

    toggleDayNight() {
        const root = document.documentElement;
        const current = root.getAttribute('data-theme');
        root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    }
}

const page = new Page();
page.init();


