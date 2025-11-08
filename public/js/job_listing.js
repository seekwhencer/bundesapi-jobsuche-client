import EventEmitter from "./event_emitter.js";
import ListingFilter from "./listing_filter.js";

export default class JobListing extends EventEmitter {
    constructor(page) {
        super();

        this.page = page;
        this.jobs = this.page.jobs;
        this.detail = this.page.detail;

        this.element = document.querySelector("#list");
        this.filterElement = document.querySelector("#filter");
        this.loadListBtn = document.querySelector("#load-list");
        this.loadLikedBtn = document.querySelector("#load-liked");
        this.loadIgnoredBtn = document.querySelector("#load-ignored");

        /**
         * the filter stuff
         */

        this.filterElement.addEventListener("input", () => this.filterQuery.keyword = this.filterElement.value.toLowerCase());
        this.loadListBtn.onclick = () => this.load();
        this.loadLikedBtn.onclick = () => this.filterByProperty('liked');
        this.loadIgnoredBtn.onclick = () => this.filterByProperty('ignored');

        this.listingFilter = new ListingFilter(this);

        this.listingFilter.on('liked', liked => liked === true ? this.loadLikedBtn.className = 'included' : liked === false ? this.loadLikedBtn.className = 'excluded' : this.loadLikedBtn.className = '');
        this.listingFilter.on('ignored', ignored => ignored === true ? this.loadIgnoredBtn.className = 'included' : ignored === false ? this.loadIgnoredBtn.className = 'excluded' : this.loadIgnoredBtn.className = '');
        this.listingFilter.on('keyword', keyword => null);
        this.listingFilter.on('update', () => this.filter());

        this.filterQuery = this.listingFilter.query;

        this.filterQuery.liked = undefined;
        this.filterQuery.ignored = false;
        this.filterQuery.search = false;
        this.filterQuery.keyword = false;
    }

    async load() {
        try {
            const res = await fetch("/api/list");
            this.jobs = await res.json();
            this.jobs.sort((a, b) => new Date(b.modifikationsTimestamp) - new Date(a.modifikationsTimestamp));
            this.filter();
            this.filterElement.value = "";
        } catch (err) {
            this.element.innerHTML = "<p>Fehler beim Laden der Daten.</p>";
            console.error(err);
        }
    }

    render(jobs) {
        jobs = jobs ? jobs : this.jobs
        this.element.innerHTML = "";
        for (const j of jobs) {
            const div = document.createElement("div");
            div.className = "card";

            j.liked === true ? div.classList.add("liked") : null;
            j.ignored === true ? div.classList.add("ignored") : null;

            div.innerHTML =
                `<b>${esc(j.titel || j.beruf || "—")}</b>` +
                `<div class="meta">${esc(j.arbeitgeber || "")} · ${esc(j.arbeitsort?.ort || "")}</div>` +
                `<div class="date">${(new Date(j.modifikationsTimestamp)).toLocaleString("de-DE").split(', ')[0]}</div>` +
                `<div class="searches">` +
                `${ Object.keys(j.searches).map(s => `<div class="search"><strong>${j.searches[s].location}</strong>${j.searches[s].radius ? ` (${j.searches[s].radius}km)` : ''}${j.searches[s].search ? ` - <strong>${j.searches[s].search}</strong>` : ''}${j.searches[s].days ? `, ${j.searches[s].days} Tage` : ''}</div>`).join("") }` +
                `</div>` +
                `<div class="actions"><button class="like">${j.liked ? '♥' : '♡'}</button><button class="ignore">☢</button></div>`;
            div.onclick = (e) => this.select(j.id, div, e);
            this.element.appendChild(div);
        }
    }


    flushCards(card) {
        this.element.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    }

    async select(id, card, e) {
        if (e.target.classList.contains('like'))
            return await this.like(id, card, e.target);

        if (e.target.classList.contains('ignore'))
            return await this.ignore(id, card, e.target);

        await this.detail.load(id, card);
    }

    async like(id, card, button) {
        const res = await fetch(`/api/job/like/${encodeURIComponent(id)}`);
        if (!res.ok) {
            return;
        }
        const job = await res.json();
        if (job.liked === true) {
            card.classList.add('liked');
            button.innerHTML = '♥';
        } else {
            card.classList.remove('liked');
            button.innerHTML = '♡';
        }
        this.updateJob(id, {liked: job.liked});
    }

    async ignore(id, card, button) {
        const res = await fetch(`/api/job/ignore/${encodeURIComponent(id)}`);
        if (!res.ok) {
            return;
        }
        const job = await res.json();
        job.ignored === true ? card.classList.add('ignored') : card.classList.remove('ignored');
        this.updateJob(id, {ignored: job.ignored});
    }

    updateJob(id, data) {
        this.jobs.forEach((j, i) => {
            if (j.id === id) {
                this.jobs[i] = {...j, ...data};
            }
        });
    }

    filter() {
        let filtered = this.jobs;

        if (this.filterQuery.search)
            filtered = filtered.filter((j) => {
                const searchIds = Object.keys(j.searches);
                return searchIds.includes(this.filterQuery.search.id);
            });

        if (this.filterQuery.keyword)
            filtered = filtered.filter((j) => JSON.stringify(j).toLowerCase().includes(this.filterQuery.keyword));

        if (this.filterQuery.liked === true)
            filtered = filtered.filter((j) => j.liked === true);

        if (this.filterQuery.liked === false)
            filtered = filtered.filter((j) => j.liked !== true);

        if (this.filterQuery.ignored === true)
            filtered = filtered.filter((j) => j.ignored === true);

        if (this.filterQuery.ignored === false)
            filtered = filtered.filter((j) => j.ignored !== true);

        this.render(filtered);
    }

    filterByProperty(prop) {
        const availableProps = ['liked', 'ignored'];
        availableProps.forEach(p => p !== prop ? this.filterQuery[p] = undefined : null);
        this.filterQuery[prop] =
            this.filterQuery[prop] === true ? false :
                this.filterQuery[prop] === false ? undefined :
                    true;
    }
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}
