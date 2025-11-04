export default class JobDetail {
    constructor(page) {
        this.page = page;
        this.element = document.querySelector("#detail");
    }

    async load(id, card) {
        try {
            const res = await fetch(`/api/job/${encodeURIComponent(id)}`);
            if (!res.ok) {
                this.element.innerHTML = "<p>Job nicht gefunden.</p>";
                this.element.style.display = "block";
                return;
            }
            await this.render(res);
            this.flushCards(card);
            card.classList.add('selected');

        } catch (err) {
            this.element.innerHTML = "<p>Fehler beim Laden des Jobs.</p>";
        }
    }

    async render(res) {
        const month = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        const job = await res.json();
        this.element.style.display = "block";
        this.element.innerHTML =
            `<div class="date"><span class="day">${(new Date(job.modifikationsTimestamp)).getDate()}</span><span class="month">${month[new Date(job.modifikationsTimestamp).getMonth()]}</span><span class="year">${new Date(job.modifikationsTimestamp).getFullYear()}</span></div>` +
            `<h2>${esc(job.titel || job.beruf || "—")}</h2>` +
            `<div>${esc(job.arbeitgeber || "")}</div>` +
            `<div>${esc(job.arbeitsort?.ort || "")}</div>` +
            (job.jobTitles.length > 0
                ? `<ul class="job-titles">${job.jobTitles.map(j => `<li class="job-title">${j}</li>`).join('')}</ul>`
                : "") +
            (job.description
                ? `<div class="description">${(job.description.replaceAll("\n", '<br>'))}</div>`
                : "") +
            `<hr><details><summary>Rohdaten</summary><pre>${JSON.stringify(job, null, '\t').replaceAll('\\n', "\n")}</pre></details>`;
    }

    flushCards(card) {
        this.page.listing.element.querySelectorAll('.card').forEach(c =>  c.classList.remove('selected') );
    }
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}
