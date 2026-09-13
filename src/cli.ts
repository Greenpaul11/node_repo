#!/usr/bin/env node
import 'tsx/esm'
import { build } from './commands/buildMetadata.js'

const [, , command, ...args] = process.argv;

switch (command) {
  case "build":
    console.log("node-repo: building metadata file...", args);
    await build(args)
    console.log("node-repo: building metadata file completed.", args);
    break;

  case "init":
    console.log("init");
    break;

  default:
    console.log("Unknown command");
}