import Event from "./event_emitter.js";

export default class JobNameFilter extends Event {
    constructor(page) {
        super();

        this.page = page;
        this.listing = this.page.listing;
        this.element = document.querySelector('#jobnames-filter');

        this.listing.on('filtered', filtered => this.render(filtered));
    }

    render(filtered) {

        let names = [];
        let count = {};
        filtered.forEach(j => {
            if (j.jobTitles.length > 0 && j.show === true) {
                j.jobTitles.forEach(title => {
                    if (!names.includes(title)) {
                        names.push(title);
                        count[title] = 1;
                    } else {
                        count[title]++;
                    }
                });
            }
        });

        // sortieren nach häufigkeit und alphabet pro count
        count = Object.entries(count)
            .sort(([keyA, valA], [keyB, valB]) => {
                if (valB !== valA) return valB - valA;
                return keyA.localeCompare(keyB);
            });

        // set the structured data
        this.data = count.map(n => {
            return {id: n[0], value: n[1]}
        });

        this.element.innerHTML = '';

        const labelRow = document.createElement("div");
        labelRow.className = "label-row";
        this.listing.filterQuery.jobTitle !== undefined && this.listing.filterQuery.jobTitle !== '' ? labelRow.innerHTML = `<strong>${this.listing.filterQuery.jobTitle}</strong>` : null;

        const button = document.createElement("button");
        button.onclick = e => this.listing.filterQuery.jobTitle = '';
        button.innerHTML = `Alle`;
        labelRow.append(button);
        this.element.append(labelRow);

        count.forEach(j => {
            const button = document.createElement("button");
            button.className = this.listing.filterQuery.jobTitle === j[0] ? `active` : ``;
            button.onclick = e => this.listing.filterQuery.jobTitle = j[0];
            button.innerHTML = `${j[0]} (${j[1]})`;
            this.element.append(button);
        });

        if (count.length === 0) {
            const msg = document.createElement("div");
            msg.innerHTML = 'Keine Berufsbezeichnungen gefunden.';
            this.element.append(msg);
        }
    }
}
