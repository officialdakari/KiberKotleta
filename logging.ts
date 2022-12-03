import moment from "moment";
import { green, yellow, red } from "colors";

export default function enableBetterLogging() {
    const _log = console.log;
    const _warn = console.warn;
    const _error = console.error;
    const _info = console.info;
    const _debug = console.debug;
    console.log = (...args) => {
        _log(`${moment().format('YYYY.M.DD HH:mm:ss')} [${green('INFO')}]`, ...args);
    };
    console.info = (...args) => {
        _info(`${moment().format('YYYY.M.DD HH:mm:ss')} [${green('INFO')}]`, ...args);
    };
    console.warn = (...args) => {
        _warn(`${moment().format('YYYY.M.DD HH:mm:ss')} [${yellow('WARNING')}]`, ...args);
    };
    console.error = (...args) => {
        _error(`${moment().format('YYYY.M.DD HH:mm:ss')} [${red('ERROR')}]`, ...args);
    };
    console.debug = (...args) => {
        _debug(`${moment().format('YYYY.M.DD HH:mm:ss')} [${red('ERROR')}]`, ...args);
    };
}