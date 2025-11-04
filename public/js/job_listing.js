export default class JobListing {
    constructor(page) {
        this.page = page;
        this.jobs = this.page.jobs;
        this.detail = this.page.detail;

        this.element = document.querySelector("#list");
        this.filterElement = document.querySelector("#filter");
        this.loadListBtn = document.querySelector("#load-list");

        this.filterElement.addEventListener("input", () => {
            const q = this.filterElement.value.toLowerCase();
            this.filter(q);
        });
        this.loadListBtn.onclick = () => this.load();
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
            div.innerHTML =
                `<b>${esc(j.titel || j.beruf || "—")}</b>` +
                `<div class="meta">${esc(j.arbeitgeber || "")} · ${esc(j.arbeitsort?.ort || "")}</div>` +
                `<div class="date">${(new Date(j.modifikationsTimestamp)).toLocaleString("de-DE").split(', ')[0]}</div>` +
                `<div class="search"><strong>${j.search.location}</strong>${j.search.radius ? ` (${j.search.radius}km)` : ''}${j.search.search ? ` - ${j.search.search}` : ''}${j.search.days ? `, ${j.search.days} Tage` : ''}</div>`;
            div.onclick = (e) => this.detail.load(j.id, div);
            this.element.appendChild(div);
        }
    }

    filter(q) {
        let filtered = this.jobs;

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
            filtered = filtered.filter((j) => JSON.stringify(j, null, '').toLowerCase().includes(this.filterString));

        if (this.filterSearch)
            filtered = filtered.filter((j) => j.search.id === this.filterSearch.id);

        this.render(filtered);
    }
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}