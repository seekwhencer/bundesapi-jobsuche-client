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
        const linksAndEmails = extractLinksAndEmails(job.description) || false;
        this.element.style.display = "block";
        this.element.innerHTML =
            `<div class="date"><span class="day">${(new Date(job.modifikationsTimestamp)).getDate()}</span><span class="month">${month[new Date(job.modifikationsTimestamp).getMonth()]}</span><span class="year">${new Date(job.modifikationsTimestamp).getFullYear()}</span></div>` +
            `<h2>${esc(job.titel || job.beruf || "—")}</h2>` +
            `<div>${esc(job.arbeitgeber || "")}</div>` +
            `<div>${esc(job.arbeitsort?.ort || "")}</div>` +
            (job.jobTitles.length > 0
                ? `<ul class="job-titles">${job.jobTitles.map(j => `<li class="job-title">${j}</li>`).join('')}</ul>`
                : "") +
            (linksAndEmails.links ? `<div class="links">${linksAndEmails.links.map(l => `<a href="${esc(l)}" target="_blank">${l}</a>`).join("")}</div>` : "" ``) +
            (linksAndEmails.emails ? `<div class="emails">${linksAndEmails.emails.map(e => `<button class="email">${e}</button>`).join("")}</div>` : "" ``) +
            (job.description
                ? `<div class="description">${linkifyAndItalicize(job.description.replaceAll("\n", '<br>').replaceAll("<br><br><br>", '<br><br>'))}</div>`
                : "") +
            `<hr>`+
            `${job.externeUrl ? `<a href="${job.externeUrl}" target="_blank">Externer Link zum Job</a>` : ''}` +
            `<details><summary>Rohdaten</summary><pre>${JSON.stringify(job, null, '\t').replaceAll('\\n', "\n")}</pre></details>`;
    }

    flushCards(card) {
        this.page.listing.flushCards(card);
    }
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}

function linkifyAndItalicize(text) {
    if (!text) return "";

    // Emails in <i> Tags packen
    const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    text = text.replace(emailPattern, '<button class="email">$&</button>');

    // URLs erkennen (mit oder ohne http/https)
    const urlPattern = /\b((https?:\/\/)|(www\.))[^\s<]+[^<.,:;"')\]\s]/gi;
    text = text.replace(urlPattern, match => {
        const url = match.startsWith("http") ? match : `https://${match}`;
        return `<a href="${url}" target="_blank">${match}</a>`;
    });

    return text;
}

function extractLinksAndEmails(text) {
    if (!text) return { links: [], emails: [] };

    const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    const urlPattern = /\b((https?:\/\/)|(www\.))[^\s<]+[^<.,:;"')\]\s]/gi;

    const emails = [...new Set(text.match(emailPattern) || [])] || false;
    const rawLinks = [...new Set(text.match(urlPattern) || [])];

    // Fehlendes Protokoll ergänzen
    const links = rawLinks.map(l => (l.startsWith("http") ? l : `https://${l}`)) || false;

    return { links, emails };
}
