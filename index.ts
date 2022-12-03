import start from "./KiberKotleta";
import enableBetterLogging from "./logging";
import { existsSync, mkdirSync } from "fs";

enableBetterLogging();

if (!existsSync("./options")) mkdirSync("./options");
if (!existsSync("./plugins")) mkdirSync("./plugins");

start();