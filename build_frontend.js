import * as esbuild from 'esbuild'

import path from "path";
import {fileURLToPath} from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename));
const buildDir = `${__dirname}/build`;

await esbuild.build({
    entryPoints: ['page.js'],
    absWorkingDir: `${__dirname}/public/js`,
    outfile:  `${buildDir}/js/page.js`,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2022']
});

await esbuild.build({
    entryPoints: ['page.css'],
    absWorkingDir: `${__dirname}/public/css`,
    outfile: `${buildDir}/css/page.css`,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2022']
});