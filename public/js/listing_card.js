import EventEmitter from "./event_emitter.js";

export default class ListingCard extends EventEmitter {
    constructor(job, listing) {
        super();

        this.listing = listing
        this.page = this.listing.page;
        this.detail = this.page.detail;
        this.element = false;

        this.data = new Proxy({}, {
            get: (target, prop, receiver) => {
                return target[prop];
            },

            set: (target, prop, value) => {
                if (target[prop] === value)
                    return true;

                const existing = !!target[prop];
                this[prop] = target[prop] = value;

                if (!existing) {
                    this.emit('create', prop, value);
                    this.emit(prop, value, 'create');
                } else {
                    this.emit('update', prop, value);
                    this.emit(prop, value, 'update');

                }
                return true;
            },

            deleteProperty: (target, prop, receiver) => {
                delete target[prop];
                this.emit('delete', prop);
                this.emit(prop, 'delete');
                return true;
            }
        });

        // add props
        Object.keys(job).forEach(key => this.data[key] = job[key]);

        // render on create
        this.render();
    }

    render() {
        this.element = document.createElement("div");
        this.element.className = `card${this.data.selected === true ? " selected" : ""}`;

        this.data.liked === true ? this.element.classList.add("liked") : null;
        this.data.ignored === true ? this.element.classList.add("ignored") : null;

        const sinceLabels = {
            0: "Heute",
            1: "Gestern",
            7: "Vor 1 Woche",
            14: "Vor 2 Wochen",
            28: "Vor 3 Wochen"
        }

        this.element.innerHTML =
            `<b>${esc(this.data.titel || this.data.beruf || "—")}</b>` +
            `<div class="meta">${esc(this.data.arbeitgeber || "")} · ${esc(this.data.arbeitsort?.ort || "")}</div>` +
            `<div class="date">${(new Date(this.data.modifikationsTimestamp)).toLocaleString("de-DE").split(', ')[0]}</div>` +
            `<div class="searches">` +
            `${Object.keys(this.data.searches).map(s => `
                <div class="search">
                    <strong>${this.data.searches[s].location}</strong>
                    ${this.data.searches[s].radius ? ` (${this.data.searches[s].radius}km)` : ''}
                    ${this.data.searches[s].search ? ` - <strong>${this.data.searches[s].search}</strong>` : ''}
                    ${this.data.searches[s].days !== undefined ? `, ${sinceLabels[this.data.searches[s].days]}` : ''}
                </div>`).join("")}
            ` +
            `</div>` +
            `<div class="actions"><button class="like">${this.data.liked ? '♥' : '♡'}</button><button class="ignore">☢</button></div>`;

        this.element.onclick = e => this.select(e);
        this.listing.element.appendChild(this.element);
        return this.element;
    }

    async select(e) {
        if (e.target.classList.contains('like'))
            return await this.like(e.target);

        if (e.target.classList.contains('ignore'))
            return await this.ignore();

        await this.detail.load(this);
        this.selected = true;
    }

    async like(button) {
        const res = await fetch(`/api/job/like/${encodeURIComponent(this.data.id)}`);
        if (!res.ok) {
            return;
        }
        const job = await res.json();
        if (job.liked === true) {
            this.element.classList.add('liked');
            button.innerHTML = '♥';
        } else {
            this.element.classList.remove('liked');
            button.innerHTML = '♡';
        }
        this.update(this.data.id, {liked: job.liked});
    }

    async ignore() {
        const res = await fetch(`/api/job/ignore/${encodeURIComponent(this.data.id)}`);
        if (!res.ok) {
            return;
        }
        const job = await res.json();
        job.ignored === true ? this.element.classList.add('ignored') : this.element.classList.remove('ignored');
        this.update({ignored: job.ignored});
    }

    update(data) {
        Object.keys(data).forEach(key => this.data[key] = data[key]);
    }

    get selected() {
        return this._selected || false;
    }

    set selected(value) {
        value === true ? this.listing.jobs.forEach(job => job.selected = false) : null;
        this._selected = value;
        value === true ? this.element.classList.add('selected') : this.element.classList.remove('selected');
    }

    get jobs() {
        return this.page.jobs;
    }

    set jobs(value) {
        ///
    }

    get show() {
        return this._show;
    }

    set show(value) {
        this._show = value;
        value !== true ? this.element.classList.add('hidden') : this.element.classList.remove('hidden');
    }
}

function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
}