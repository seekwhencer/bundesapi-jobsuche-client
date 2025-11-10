export default class WebsocketClient {
    constructor(page) {
        this.page = page;
        this.socket = new WebSocket("/logs");

        this.socket.addEventListener("open", (event) => {
            console.log("Verbunden mit dem Server");
        });

        this.socket.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data);
            const row = document.createElement("div");
            row.innerHTML = msg.message;
            this.page.searches.serverLogsElement.append(row);
            this.page.searches.serverLogsElement.scrollTo({
                top: this.page.searches.serverLogsElement.scrollHeight,
                behavior: 'smooth'
            });
        });

        this.socket.addEventListener("error", (error) => {
            console.error("WebSocket-Fehler:", error);
        });

        this.socket.addEventListener("close", (event) => {
            console.log("Verbindung geschlossen:", event.code, event.reason);
        });
    }
}