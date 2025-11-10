import https from 'https';
import {URL} from 'url';
import fs from 'fs-extra';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import Events from "./EventEmitter.js";
import path from "path";

export default class Fetcher extends Events {
    constructor(jobbinger) {
        super();
        this.jobbinger = jobbinger;
        this.log = this.jobbinger.logger.log;
        this.error = this.jobbinger.error;

        this.defaults = {
            location: 'Berlin',
            radius: 20,
            days: 2,
            search: 'Küche',
            baseUrl: 'https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs',
            jobDetailBase: 'https://www.arbeitsagentur.de/jobsuche/jobdetail/',
            pageSize: 200,
            dataPath: 'data',
            parallelLimit: 5,
        };

        this.__dirname =  process.cwd();
        this.dataDir = path.join(this.__dirname, "data");
        this.jobsDir = path.join(this.dataDir, "jobs");
        this.searchDir = path.join(this.dataDir, "search");

        fs.mkdirpSync(this.jobsDir);
        fs.mkdirpSync(this.searchDir);
    }
    
    async batch(stack) {
        for (const search of stack) {
            await this.search(search);
        }
    }

    async props(options) {
        const props = {...this.defaults, ...options};

        props.outputPath = this.jobsDir;
        props.searchPath = this.searchDir;

        // Hash für eindeutigen Ordnernamen
        /*const hashBase = `${props.location}_${props.radius}_${props.days}_${props.search}`;
        const hash = crypto.createHash('md5').update(hashBase).digest('hex').slice(0, 12);

        //props.outputPath = `${props.dataPath}/${hash}`;
        props.outputPath = this.jobsDir;
        props.searchPath = this.searchDir;

        await fs.mkdirp(props.outputPath);
        await fs.mkdirp(props.searchPath);

        //await fs.writeJson(`${props.searchPath}/${hash}.json`, props, {spaces: 2});
*/
        return props;
    }

    async search(options) {
        const props = await this.props(options);
        const jobsCount = await this.fetchAll(props).catch(err => this.error('❌ Fehler:', err.message));

        this.log(`\n✅ Fertig. Insgesamt ${jobsCount} Jobs verarbeitet.`);
        this.log(`📂 Ordner: ${props.outputPath}\n`);

        return Promise.resolve();
    }

    async fetchPage(page, props) {
        const options = {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': 'jobboerse-jobsuche',
                'User-Agent': 'Mozilla/5.0 (Fetcher Script)'
            }
        };

        return new Promise((resolve, reject) => {
            const url = new URL(props.baseUrl);
            url.searchParams.set('page', page.toString());
            url.searchParams.set('size', props.pageSize.toString());
            url.searchParams.set('wo', props.location);
            url.searchParams.set('umkreis', props.radius.toString());
            if (props.search) url.searchParams.set('was', props.search);
            //if (parseInt(props.days) > 0) url.searchParams.set('aktualisiertSeit', props.days);
            if (parseInt(props.days) > 0) url.searchParams.set('veroeffentlichtseit', props.days);

            https.get(url, options, res => {
                let data = '';

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    res.resume();
                    return;
                }

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const jobs = json?.stellenangebote || [];
                        resolve(jobs);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
    }

    async fetchDetail(refnr, props) {
        const url = `${props.jobDetailBase}${refnr}`;

        return new Promise((resolve) => {
            https.get(url, res => {
                if (res.statusCode !== 200) {
                    resolve({description: '', jobTitles: []});
                    return;
                }
                let html = '';
                res.on('data', chunk => html += chunk);
                res.on('end', () => {
                    try {
                        const $ = cheerio.load(html);

                        const jobTitles = [];
                        $('.beruf-tag').each((_, el) => jobTitles.push($(el).text().trim()));

                        const detail = {
                            description: $('#detail-beschreibung-beschreibung').text().trim(),
                            jobTitles: jobTitles,
                        };

                        resolve(detail);
                    } catch {
                        resolve({description: '', jobTitles: []});
                    }
                });
            }).on('error', () => resolve({description: '', jobTitles: []}));
        });
    }

    async fetchAll(props) {
        this.log(`🔍 Suche Jobs in "${props.location}" (Umkreis ${props.radius} km)${props.search ? ` für "${props.search}"` : ''}${parseInt(props.days) > 0 ? `, aktualisiert in den letzten ${props.days} Tagen` : ''}...\n`);

        let totalCount = 0;
        let page = 1;

        while (true) {
            this.log(`➡️  Lade Seite ${page}...`);
            let jobs = [];
            try {
                jobs = await this.fetchPage(page, props);
            } catch (err) {
                this.error(`⚠️ Fehler bei Seite ${page}: ${err.message}`);
                break;
            }

            if (!jobs || jobs.length === 0) {
                this.log('📭 Keine weiteren Ergebnisse.');
                break;
            }

            // Limitierte Parallelität
            const limit = props.parallelLimit;
            for (let i = 0; i < jobs.length; i += limit) {
                const chunk = jobs.slice(i, i + limit);
                await Promise.all(chunk.map(async (j) => {
                    const jobFile = `${props.outputPath}/${j.refnr}.json`;

                    const search = {
                        id: props.id,
                        location: props.location,
                        search: props.search,
                        radius: props.radius,
                        days: props.days
                    }

                    // Cache prüfen
                    if (await fs.pathExists(jobFile)) {
                        this.log(`⚙️  Überspringe vorhandene Job-Details ${j.refnr}`);
                        const existingJob = await fs.readJson(jobFile);
                        j.description = existingJob.description;
                        j.jobTitles = existingJob.jobTitles;
                        j.liked = existingJob.liked;
                        j.ignored = existingJob.ignored;
                        j.searches = existingJob.searches;

                    } else {
                        const detail = await this.fetchDetail(j.refnr, props);
                        j.description = detail.description;
                        j.jobTitles = detail.jobTitles;
                        j.searches = {};
                    }

                    j.searches[search.id] = search;

                    await fs.writeJson(jobFile, j, {spaces: 2});
                    this.log(`💾 Gespeichert: ${j.refnr}`);
                    totalCount++;
                }));
            }
            page++;
        }

        return totalCount;
    }
}
