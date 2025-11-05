export default class JobListing {
    constructor(page) {
        this.page = page;
        this.jobs = this.page.jobs;
        this.detail = this.page.detail;

        this.element = document.querySelector("#list");
        this.filterElement = document.querySelector("#filter");
        this.loadListBtn = document.querySelector("#load-list");
        this.loadLikedBtn = document.querySelector("#load-liked");
        this.loadIgnoredBtn = document.querySelector("#load-ignored");

        this.filterElement.addEventListener("input", () => {
            const q = this.filterElement.value.toLowerCase();
            this.filter(q);
        });
        this.loadListBtn.onclick = () => this.load();
        this.loadLikedBtn.onclick = () => this.filter('"liked":true');
        this.loadIgnoredBtn.onclick = () => this.filter('"ignored":true');
    }

    async load() {
        try {
            const res = await fetch("/api/list");
            this.jobs = await res.json();
            this.jobs.sort((a, b) => new Date(b.modifikationsTimestamp) - new Date(a.modifikationsTimestamp));
            this.render();
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

            if (j.liked)
                div.classList.add("liked");

            if (j.ignored)
                div.classList.add("ignored");

            div.innerHTML =
                `<b>${esc(j.titel || j.beruf || "—")}</b>` +
                `<div class="meta">${esc(j.arbeitgeber || "")} · ${esc(j.arbeitsort?.ort || "")}</div>` +
                `<div class="date">${(new Date(j.modifikationsTimestamp)).toLocaleString("de-DE").split(', ')[0]}</div>` +
                `<div class="search"><strong>${j.search.location}</strong>${j.search.radius ? ` (${j.search.radius}km)` : ''}${j.search.search ? ` - ${j.search.search}` : ''}${j.search.days ? `, ${j.search.days} Tage` : ''}</div>` +
                `<div class="actions"><button class="like">${j.liked ? '♥' : '♡'}</button><button class="ignore">☢</button></div>`;
            div.onclick = (e) => this.select(j.id, div, e);
            this.element.appendChild(div);
        }
    }

    filter(q) {
        let filtered = this.jobs;

        console.log('>>>', q);

        if (typeof q === "string") {
            this.filterString = q;
            if (q === '')
                this.filterString = false;
        }

        if (typeof q === "object")
            this.filterSearch = q

        if (!q)
            this.filterSearch = false;

        if (this.filterString)
            filtered = filtered.filter((j) => JSON.stringify(j).toLowerCase().includes(this.filterString));

        if (this.filterSearch)
            filtered = filtered.filter((j) => j.search.id === this.filterSearch.id);

        this.render(filtered);
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
    }

    async ignore(id, card, button) {
        const res = await fetch(`/api/job/ignore/${encodeURIComponent(id)}`);
        if (!res.ok) {
            return;
        }
        const job = await res.json();
        job.ignored === true ? card.classList.add('ignored') : card.classList.remove('ignored');
    }

}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}