import express from "express";
import fs from 'fs-extra';
import {existsSync, readdirSync, mkdirSync, unlinkSync} from "fs";
import path from "path";

export default class Server {
    constructor(fetcher) {
        this.fetcher = fetcher;
        this.__dirname =  process.cwd();

        this.publicDir = path.join(this.__dirname, "public");
        this.dataDir = path.join(this.__dirname, "data");
        this.jobsDir = path.join(this.dataDir, "jobs");
        this.searchDir = path.join(this.dataDir, "search");

        if (!existsSync(this.jobsDir)) mkdirSync(this.jobsDir, {recursive: true});
        if (!existsSync(this.searchDir)) mkdirSync(this.searchDir, {recursive: true});

        this.port = process.env.PORT || 3000;

        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(this.publicDir));

        this.registerRoutes();
    }

    run() {
        this.app.listen(this.port, () => {
            console.log(`Server läuft auf http://localhost:${this.port}`);
            console.log(`Frontend: ${this.publicDir}`);
            console.log(`Job-Daten aus: ${this.jobsDir}`);
            console.log(`Such-Daten aus: ${this.searchDir}`);
        });
    }

    registerRoutes() {
        // job listing
        this.app.get("/api/list", async (req, res) => {
            try {
                const files = await this.readJsonFiles();
                const list = files.map(({id, data}) => ({
                    id,
                    titel: data.titel,
                    beruf: data.beruf,
                    arbeitgeber: data.arbeitgeber,
                    arbeitsort: data.arbeitsort,
                    refnr: data.refnr,
                    aktuelleVeroeffentlichungsdatum: data.aktuelleVeroeffentlichungsdatum,
                    modifikationsTimestamp: data.modifikationsTimestamp,
                    jobTitles: data.jobTitles,
                    searches: data.searches,
                    liked: data.liked,
                    ignored: data.ignored
                }));
                res.json(list);
            } catch (err) {
                res.status(500).json({error: "Fehler beim Lesen der Daten"});
            }
        });

        //
        this.app.get("/api/job/:id", async (req, res) => {
            const id = req.params.id;
            const file = path.join(this.jobsDir, id + ".json");
            if (!file.startsWith(this.jobsDir) || !existsSync(file))
                return res.status(404).json({error: "Job nicht gefunden"});
            try {
                const raw = await fs.readFile(file, "utf8");
                res.json(JSON.parse(raw));
            } catch {
                res.status(500).json({error: "Fehler beim Lesen der Datei"});
            }
        });

        // delete search results
        this.app.delete("/api/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const files = readdirSync(this.jobsDir).filter(f => f.endsWith(".json"));
            const jobs = [];
            for (const f of files) {
                const raw = await fs.readFile(path.join(this.jobsDir, f));
                const job = JSON.parse(raw);
                jobs.push(job);
            }
            //const filtered = jobs.filter((j) => j.search.id === id);
            const filtered = jobs.filter((j) => {
                const searchIds = Object.keys(j.searches);
                return searchIds.includes(id);
            });
            for (const f of filtered) {
                const file = path.join(this.jobsDir, `${f.refnr}.json`);
                if (existsSync(file)) unlinkSync(file);
            }
            res.json({success: true, deleted: filtered.length});
        });

        // searches
        this.app.get("/api/search", async (req, res) => {
            const files = readdirSync(this.searchDir).filter(f => f.endsWith(".json"));
            const result = [];
            for (const f of files) {
                const raw = await fs.readFile(path.join(this.searchDir, f));
                const data = JSON.parse(raw);
                result.push(data);
            }
            res.json(result);
        });

        // create search
        this.app.post("/api/search", async (req, res) => {
            const id = Date.now().toString();
            const data = req.body;
            data.id = id;

            console.log(data);

            await fs.writeFile(path.join(this.searchDir, `${id}.json`), JSON.stringify(data, null, 2));
            res.json({success: true, id});
        });

        // update search
        this.app.post("/api/search/:id", async (req, res) => {
            const file = path.join(this.searchDir, `${req.params.id}.json`);
            if (!existsSync(file)) return res.status(404).json({error: "Not found"});
            const data = req.body;
            data.id = req.params.id;
            await fs.writeFile(file, JSON.stringify(data, null, 2));
            res.json({success: true});
        });

        // delete search
        this.app.delete("/api/search/:id", async (req, res) => {
            const file = path.join(this.searchDir, `${req.params.id}.json`);
            if (existsSync(file)) unlinkSync(file);
            res.json({success: true});
        });

        // run search
        this.app.post("/api/search/:id/run", async (req, res) => {
            console.log(`Trigger gestartet für Suche: ${req.params.id}`);

            if (req.params.id === 'undefined') {
                res.json({triggered: false, message: `No ID given`});
                return;
            }

            const file = path.join(this.searchDir, `${req.params.id}.json`);
            if (!existsSync(file)) {
                res.json({triggered: false, message: `File not exists: ${file}`});
            } else {
                try {
                    const raw = await fs.readFile(file, "utf8");
                    const parsed = JSON.parse(raw);
                    await this.fetcher.search(parsed);

                    res.json({triggered: true, ...parsed});
                } catch (err) {
                    console.error(`Fehler in ${file}:`, err);
                }
            }
        });

        // like
        this.app.get("/api/job/like/:id", async (req, res) => {
            const id = req.params.id;
            const file = hardenFilename(`${decodeURIComponent(id)}.json`, this.jobsDir);

            if (!existsSync(file))
                return res.json({message: 'job not exists', id: id, file: file});

            const raw = await fs.readFile(file);
            const job = JSON.parse(raw);
            job.liked === true ? job.liked = false : job.liked = true;
            await fs.writeJson(file, job, {spaces: 2});
            res.json(job);
        });

        // ignore
        this.app.get("/api/job/ignore/:id", async (req, res) => {
            const id = req.params.id;
            const file = hardenFilename(`${decodeURIComponent(id)}.json`, this.jobsDir);

            if (!existsSync(file))
                return res.json({message: 'job not exists', id: id, file: file});

            const raw = await fs.readFile(file);
            const job = JSON.parse(raw);
            job.ignored === true ? job.ignored = false : job.ignored = true;
            await fs.writeJson(file, job, {spaces: 2});
            res.json(job);
        });
    }

    async readJsonFiles() {
        const files = readdirSync(this.jobsDir).filter((f) => f.endsWith(".json"));
        const result = [];
        for (const f of files) {
            const full = path.join(this.jobsDir, f);
            try {
                const raw = await fs.readFile(full, "utf8");
                const parsed = JSON.parse(raw);
                result.push({id: path.basename(f, ".json"), data: parsed});
            } catch (err) {
                console.error(`Fehler in ${f}:`, err.message);
            }
        }
        return result;
    }
}