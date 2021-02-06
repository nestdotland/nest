import { downloadConfig } from "../../mod/api/_todo.ts";
import * as jsonDiff from "../processing/json_diff.ts";
import * as config from "./config.ts";
import { log } from "../utils/log.ts";
import type { Json, Meta, Project } from "../utils/types.ts";

export async function isConfigUpToDate(): Promise<boolean> {
  const meta = await config.meta.parse();
  const project = await config.project.parse();
  const ignore = await config.ignore.read();
  const remote = await downloadConfig(project);

  const diff = jsonDiff.compare(meta as Json, remote.meta as Json);
  return jsonDiff.isUnchanged(diff) && ignore === remote.ignore;
}

export async function updateFiles(
  meta: Meta,
  project: Project,
  ignore: string,
): Promise<void> {
  project.meta = meta;
  project.lastSync = new Date().getTime();
  await config.meta.write(meta);
  await config.project.write(project);
  await config.ignore.write(ignore);
  log.info("Successfully updated config !");
}
