import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { ConstructorConifg, OrmOptions } from "../types/Config.js";
import fs from "node:fs";
import { dirExistsSync } from "../lib/file.js";
import constructorConfigDefault from "../constructors/config.js";

export async function build(args: string[]) {
  const path = args[0]
  if (!path) {
    console.error(`Path: ${path} does not exist!`);
    process.exit(1);
  }

  // get config
  const repoRoot = process.cwd()

  const configPath = join(repoRoot, path);

  const configModule = await import(pathToFileURL(configPath).href);

  const raw = configModule.default ?? configModule
  const config = raw.default ?? raw as ConstructorConifg
  
  const identifier = config.consoleLogIdentifier 
    ? config.consoleLogIdentifier 
    : constructorConfigDefault.consoleLogIdentifier
  
  // get connection
  if (!Object.hasOwn(config, 'connection')) {
    throw new Error(`"${identifier}: connection" entry for path: "${path}" is not provided.`)
  }
  const connection: OrmOptions = config.connection;

  // get repoPath
  if (!Object.hasOwn(config, 'dirName')) {
    console.log(`${identifier}: constructor configuration has no entry "dirName".` +
      'New directory will be created (if not exist) with default name "repository".'
    )
    config['dirName'] = 'repository'
  }
  
  const repoPath = join(repoRoot, config['dirName']!)
  
  try {
    if (dirExistsSync(repoPath)) {
      console.log(`${identifier}: target directory "${config['dirName']}/" exist.`);
    } else {
      console.log(`${identifier}: creating directory "${config['dirName']}/..."`);
      fs.mkdirSync(repoPath, { recursive: true })
      console.log(`${identifier}: dierectory "${config['dirName']}/" successfully created.`)
    }
  } catch (err) {
    console.error(err);
  }

  // construct entities if required
  if (config['constructEntities']) {
    try {
      console.log(`${identifier}: starting constructing entities.`)
      const constructorModule = await import(`../constructors/entityConstructor/${detectOrm(connection)}/build.js`)
      const constructEntities = constructorModule.constructEntities

      constructEntities(repoPath, config)

      console.log(`${identifier}: successsfully constructed entities, under path: ${repoPath}/entities.ts`)
    } catch (error) {
      console.log(`${identifier}: constructing entities failure!`)
      console.error(error)
    }
  }

  // construct metadatas if required
  if (config['constructMetadatas']) {
    try {
      console.log(`${identifier}: starting constructing metadatas.`)
      const constructorModule = await import(`../constructors/metadataConstructor/${detectOrm(connection)}/build.js`)
      const constructMetadatas = constructorModule.constructMetadatas

      constructMetadatas(repoPath, config)

      console.log(`${identifier}: successsfully constructed metadatas, under path: ${repoPath}/metadatas.ts`)
    } catch (error) {
      console.log(`${identifier}: constructing metadatas failure!`)
      console.error(error)
    }
  }
}

function detectOrm(connection: OrmOptions) {
  if (Object.hasOwn(connection.constructor, 'name')) {
    const name = connection.constructor.name
    if (name === 'Sequelize') {
      return 'sequelize'
    }
  }
  throw new Error('Cannot determine connection type!')
}

