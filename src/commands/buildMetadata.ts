import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { createConstructors } from '../builders/metadataConstructor/sequelize/build.js'
import { OrmOptions } from "../types/Config.js";

export async function build(args: string[]) {
  const path = args[0];
  const writePath = args[1] ? args[1] : path

  if (!path) {
    console.error(`Path: ${path} does not exist!`);
    process.exit(1);
  }

  // get config
  const repoRoot = process.cwd()

  const configPath = join(repoRoot, path);

  const configModule = await import(pathToFileURL(configPath).href);

  const config = configModule.default;

  const connection: OrmOptions = config.connection;

  createConstructors(writePath, connection)
}
