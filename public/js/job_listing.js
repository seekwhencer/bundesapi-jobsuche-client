import EventEmitter from "./event_emitter.js";
import ListingFilter from "./listing_filter.js";
import ListingCard from "./listing_card.js";

export default class JobListing extends EventEmitter {
    constructor(page) {
        super();

        this.page = page;
        this.jobs = this.page.jobs;
        this.detail = this.page.detail;

        this.element = document.querySelector("#list");
        this.filterElement = document.querySelector("#filter");
        this.loadLikedBtn = document.querySelector("#load-liked");
        this.loadIgnoredBtn = document.querySelector("#load-ignored");

        /**
         * the filter stuff
         */

        this.filterElement.addEventListener("input", () => this.filterQuery.keyword = this.filterElement.value.toLowerCase());
        this.filterElement.value = "";
        this.loadLikedBtn.onclick = () => this.filterByProperty('liked');
        this.loadIgnoredBtn.onclick = () => this.filterByProperty('ignored');

        this.listingFilter = new ListingFilter(this);
        this.filterQuery = this.listingFilter.query;

        this.listingFilter.on('liked', liked => liked === true ? this.loadLikedBtn.className = 'included' : liked === false ? this.loadLikedBtn.className = 'excluded' : this.loadLikedBtn.className = '');
        this.listingFilter.on('ignored', ignored => ignored === true ? this.loadIgnoredBtn.className = 'included' : ignored === false ? this.loadIgnoredBtn.className = 'excluded' : this.loadIgnoredBtn.className = '');
        this.listingFilter.on('keyword', keyword => null);
        this.listingFilter.on('update', () => this.filter());

        this.on('load', () => {
             this.jobs.sort((a, b) => {
                return new Date(b.modifikationsTimestamp) - new Date(a.modifikationsTimestamp);
            });

            // enrich by age in days
            this.jobs = this.jobs.map(job => {
                job.age = Math.floor((new Date() - new Date(job.modifikationsTimestamp)) / (1000 * 60 * 60 * 24));
                return job;
            });

            this.page.ageFilter.show();
            this.render();
            this.filter();
        });

        this.filterQuery.liked = undefined;
        this.filterQuery.ignored = false;
        this.filterQuery.search = false;
        this.filterQuery.keyword = false;
    }

    async load() {
        try {
            const res = await fetch("/api/list");
            const jobs = await res.json();
            this.jobs = [];
            jobs.forEach(job => this.jobs.push(new ListingCard(job, this)));
            this.emit('load');
        } catch (err) {
            this.element.innerHTML = "<p>Fehler beim Laden der Daten.</p>";
            console.error(err);
        }
    }

    render() {
        this.element.innerHTML = "";
        this.jobs.forEach(job => job.render());
    }

    filter() {
        const fq = this.filterQuery;

        this.jobs = this.jobs.map(j => {
            let show = true;

            if (fq.search) {
                const searchIds = Object.keys(j.searches);
                if (!searchIds.includes(fq.search.id)) show = false;
            }

            if (show && fq.keyword) {
                if (!JSON.stringify(j.data).toLowerCase().includes(fq.keyword)) show = false;
            }

            if (show && fq.liked === true) {
                if (j.liked !== true) show = false;
            }

            if (show && fq.liked === false) {
                if (j.liked === true) show = false;
            }

            if (show && fq.ignored === true) {
                if (j.ignored !== true) show = false;
            }

            if (show && fq.ignored === false) {
                if (j.ignored === true) show = false;
            }

            if (show && fq.jobTitle) {
                if (!j.jobTitles.includes(fq.jobTitle)) show = false;
            }

            if (show && fq.age_from !== undefined) {
                if (j.age < fq.age_from) show = false;
            }

            if (show && fq.age_to !== undefined) {
                if (j.age > fq.age_to) show = false;
            }

            j.show = show;
            return j;
        });

        this.emit('filtered', this.jobs);
    }

    filterByProperty(prop) {
        const availableProps = ['liked', 'ignored'];
        availableProps.forEach(p => p !== prop ? this.filterQuery[p] = undefined : null);
        this.filterQuery[prop] =
            this.filterQuery[prop] === true ? false :
                this.filterQuery[prop] === false ? undefined :
                    true;
    }

    get latestJobAge() {
        if (this.jobs.length === 0) return null;

        const latestJob = this.jobs.reduce((latest, job) => {
            const jobDate = new Date(job.modifikationsTimestamp);
            const compDate = new Date(latest.modifikationsTimestamp);
            return jobDate < compDate ? job : latest;
        }, this.jobs[0]);

        const now = new Date();
        const jobDate = new Date(latestJob.modifikationsTimestamp);
        return Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
    }

    set latestJobAge(days) {
        // read-only
    }
}

