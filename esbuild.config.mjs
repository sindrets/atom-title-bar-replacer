import { exec } from "child_process";
import { performance } from "perf_hooks";
import esbuild from "esbuild";

const devMode = process.env.NODE_ENV === "development";

async function execCmd(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject([error, stdout, stderr]);
                return;
            }
            resolve(stdout);
        });
    });
}

let last = performance.now();
await execCmd("npx tsc --noEmit").then(
    (stdout) => {
        if (stdout.length > 0) {
            console.log(stdout);
        }
        console.log("tsc done in", (performance.now() - last).toFixed(2), "ms.");
    },
    ([error, stdout, stderr]) => {
        console.error(error.message);
        if (stderr.length > 0) {
            console.error(stderr);
        }

        if (stdout.length > 0) {
            console.error(stdout);
        }

        process.exit(1);
    }
);

last = performance.now();
await esbuild.build({
    entryPoints: ["src/main.ts"],
    outfile: "dist/title-bar-replacer.js",
    bundle: true,
    platform: "node",
    target: ["node14"],
    sourcemap: true,
    external: ["atom", "electron"],
    minify: devMode ? false : true,
}).catch(_reason => {
    process.exit(1);
});

console.log("Esbuild done in", (performance.now() - last).toFixed(2), "ms.");
