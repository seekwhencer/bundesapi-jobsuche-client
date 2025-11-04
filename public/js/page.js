import JobDetails from '/js/job_detail.js';
import JobListing from '/js/job_listing.js';
import Searches from '/js/searches.js';
import SearchesFilter from '/js/searches_filter.js';

export default class Page {
    constructor() {
        this.jobs = [];
        this.detail = new JobDetails(this);
        this.listing = new JobListing(this);
        this.searches = new Searches(this);
        this.searchesFilter = new SearchesFilter(this);
    }

    async init() {
        await page.listing.load();
    }
}

const page = new Page();
await page.init();
