const { exec } = require("child_process");
const esbuild = require("esbuild");

exec("npx tsc --noEmit", (error, stdout, stderr) => {
    if (error) {
        console.error(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(stderr);
        return;
    }
    if (stdout.length > 0) {
        console.log(stdout);
    }
});

esbuild.buildSync({
    entryPoints: ["src/main.ts"],
    outfile: "lib/title-bar-replacer.js",
    bundle: true,
    platform: "node",
    target: ["node14"],
    sourcemap: true,
    external: ["atom", "electron"],
});
