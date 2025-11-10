export default class Searches {
    constructor(page) {
        this.page = page;
        this.listing = page.listing
        this.modal = document.querySelector("#modal");
        this.openBtn = document.querySelector("#open-modal");
        this.closeBtn = document.querySelector("#close-modal");
        this.addBtn = document.querySelector("#add-search");
        this.listingElement = document.querySelector("#searches-listing");

        this.openBtn.onclick = async () => this.open();
        this.closeBtn.onclick = () => this.close();
        this.addBtn.onclick = () => this.renderEditRow(false);
    }

    async load() {
        this.listingElement.innerHTML = "Lade...";
        const res = await fetch('/api/search');
        this.searches = await res.json();
        this.render();
    }

    render() {
        this.listingElement.innerHTML = "";
        if (this.searches.length === 0) {
            this.renderEditRow({});
            return;
        }
        this.searches.forEach(search => this.renderEditRow(search));
    }

    renderEditRow(search) {
        const div = document.createElement("div");
        div.className = "search-dataset";
        div.innerHTML = `
        <input type="text" placeholder="Ort oder Postleitzahl" value="${search.location || ""}">
        <input type="text" placeholder="Suchbegriff" value="${search.search || ""}">
        <input type="number" placeholder="Radius" max="200" min="0" value="${search.radius || ""}">
        <input type="number" placeholder="Tage" max="30" min="0" value="${search.days || ""}">
        <div class="search-actions">
          <button class="update">Speichern</button>
          <button class="trigger" ${!search ? 'disabled' : ''}>Start</button>
          <button class="delete">Suche löschen</button>
          <button class="delete-results" ${!search ? 'disabled' : ''}>Ergebnisse Löschen</button>
        </div>
      `;
        div.querySelector(".update").onclick = () => this.updateSearch(search.id, div);
        div.querySelector(".trigger").onclick = (e) => this.runSearch(search.id, e);
        div.querySelector(".delete").onclick = () => this.deleteSearch(search.id);
        div.querySelector(".delete-results").onclick = () => this.deleteSearchResults(search.id);
        this.listingElement.appendChild(div);
    }

    async open() {
        await this.load();
        this.modal.style.display = "flex";
    }

    close() {
        this.modal.style.display = "none";
        //this.listingElement.innerHTML = "";
    }

    async updateSearch(id, div) {
        let [location, search, radius, days] = div.querySelectorAll("input");

        if (location.value.trim() === '')
            return;

        if (radius.value.trim() === '')
            radius.value = 10;

        if (days.value.trim() === '')
            days.value = 7;

        const body = {
            location: location.value.trim(),
            radius: parseInt(radius.value),
            search: search.value.trim(),
            days: parseInt(days.value)
        };

        const url = id ? `/api/search/${id}` : `/api/search`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

        if (res.ok) {
            await this.load();
            await this.page.searchesFilter.load();
        } else alert("Fehler beim Speichern");
    }

    async deleteSearch(id) {
        if (!confirm("Suche wirklich löschen?")) return;
        await this.deleteSearchResults(id);
        const res = await fetch(`/api/search/${id}`, {method: "DELETE"});
        if (res.ok) {
            await this.load();
            await this.page.searchesFilter.load();
        } else alert("Fehler beim Löschen");
    }

    async deleteSearchResults(id) {
        if (!confirm("Suchergebnisse wirklich löschen?")) return;
        const res = await fetch(`/api/jobs/${id}`, {method: "DELETE"});
        if (res.ok) {
            await this.listing.load();
            await this.page.searchesFilter.load();
        } else alert("Fehler beim Löschen");
    }

    async runSearch(id, e) {
        e.target.disabled = true;
        const res = await fetch(`/api/search/${id}/run`, {method: "POST"});
        e.target.disabled = false;
        if (res.ok) await this.listing.load();
        else alert("Fehler beim Suchlauf");
    }

}