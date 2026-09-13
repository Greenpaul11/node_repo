import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { ConstructorConifg, OrmOptions } from "../types/Config.js";
import fs from "node:fs";

export async function build(args: string[]) {
  const path = args[0]
  if (!path) {
    console.error(`Path: ${path} does not exist!`);
    process.exit(1);
  }
  
  const writePath = args[1] ? args[1] : getRepositoryPath(path)

  // get config
  const repoRoot = process.cwd()

  const configPath = join(repoRoot, path);

  const configModule = await import(pathToFileURL(configPath).href);

  const config = configModule.default.default as ConstructorConifg
  const copyConfig = JSON.parse(JSON.stringify(config))
  
  // get connection
  if (!Object.hasOwn(config, 'connection')) {
    throw new Error(`"connection" entry for path: "${path}" is not provided.`)
  }
  const connection: OrmOptions = config.connection;

  // get repoPath
  if (!Object.hasOwn(config, 'dirName')) {
    console.log('Constructor configuration has no entry "dirName".' +
      'New directory will be created with default name "repository".'
    )
    copyConfig['driName'] = 'repository'
  }
  
  const repoPath = join(repoRoot, copyConfig['dirName'])
  
  try {
    const stats = fs.statSync(repoPath);
    if (stats.isDirectory()) {
      console.log(`Target directory "${copyConfig['dirName']}/" exist.`);
    } else {
      console.log(`Creating directory "${config['dirName']}/..."`);
      fs.mkdirSync(path, { recursive: true })
      console.log(`Dierectory "${copyConfig['dirName']}/" successfully created.`)
    }
  } catch (err) {
    console.error(err);
  }

  // construct entities if required
  if (config['constructEntities']) {
    try {
      console.log('node-repo CONSTRUCTOR: starting constructing entities.')
      const constructorModule = await import(`../builders/entityConstructor/${detectOrm(connection)}/build.js`)
      const constructEntities = constructorModule.constructEntities

      constructEntities(writePath, config)

      console.log('node-repo CONSTRUCTOR: successsfully constructed entities.')
    } catch (error) {
      console.log('node-repo CONSTRUCTOR: constructing entities failure!')
      console.error(error)
    }
  }

  // construct metadatas if required
  if (config['constructMetadatas']) {
    try {
      console.log('node-repo CONSTRUCTOR: starting constructing metadatas.')
      const constructorModule = await import(`../builders/metadataConstructor/${detectOrm(connection)}/build.js`)
      const constructMetadatas = constructorModule.constructMetadatas

      constructMetadatas(writePath, config)

      console.log('node-repo CONSTRUCTOR: successsfully constructed metadatas.')
    } catch (error) {
      console.log('node-repo CONSTRUCTOR: constructing metadatas failure!')
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

function getRepositoryPath(path: string) {
  const pathList = path.split('/')
  return pathList.slice(0, -1).join('/') 
}
