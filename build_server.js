import * as esbuild from 'esbuild'

import path from "path";
import {fileURLToPath} from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename));
const buildDir = `${__dirname}/build`;

await esbuild.build({
    entryPoints: ['index.js'],
    absWorkingDir: `${__dirname}`,
    outfile:  `${buildDir}/server.js`,
    platform: 'node',
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['node22', 'es2022']
});
