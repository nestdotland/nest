import { desc, run, sh, task } from "https://x.nest.land/drake@1.4.4/mod.ts";
import { version } from "../cli/version.ts";

const NEST_TOKEN = "nest_token";

desc("Development tools. Should be run before each commit.");
task("dev", [], async function () {
  await sh("deno fmt");
  await sh("deno lint --unstable");
  await sh("deno test -A");
});

desc("Setup Nest");
task("setup", [], async function () {
  await sh("deno install -qfA ./nest.ts");
  await sh(`nest login nest ${NEST_TOKEN} -L debug`);
  await sh("nest setup nest nest -L debug");
});

desc("Reports the details of what would have been shipped.");
task("dry-ship", ["setup"], async function () {
  await sh(`nest publish ${version} --pre dev -Yd -L debug`);
});

desc("Ship nest to nest.land.");
task("ship", ["setup"], async function () {
  await sh(`nest publish ${version} -Y -L debug`);
});

run();
