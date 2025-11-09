import JobDetails from './job_detail.js';
import JobListing from './job_listing.js';
import Searches from './searches.js';
import SearchesFilter from './searches_filter.js';
import JobNameFilter from './jobname_filter.js';

export default class Page {
    constructor() {
        this.jobs = [];
        this.detail = new JobDetails(this);
        this.listing = new JobListing(this);
        this.searches = new Searches(this);
        this.searchesFilter = new SearchesFilter(this);
        this.jobNameFilter = new JobNameFilter(this);
    }

    async init() {
        await page.listing.load();
    }
}

const page = new Page();
page.init();
