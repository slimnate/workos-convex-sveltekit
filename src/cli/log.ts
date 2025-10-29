import pc from 'picocolors';

export function logInfo(msg: unknown) { console.log(pc.cyan(String(msg))); }
export function logWarn(msg: unknown) { console.warn(pc.yellow(String(msg))); }
export function logSuccess(msg: unknown) { console.log(pc.green(String(msg))); }
export function logError(err: unknown) { console.error(pc.red(String(err))); }


