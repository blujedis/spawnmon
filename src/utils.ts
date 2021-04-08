import colors from 'ansi-colors';
import strip from 'strip-ansi';
import { Color, IMonitorOptions } from './types';

export type SimpleTimer = ReturnType<typeof createTimer>;

export const NEWLINE_EXP = /\r?\n$/u;

/**
 * Detects line returns if match slices,
 * run before transform to retain consistent
 * line returns.
 * 
 * @param line the line to be cleaned up.
 */
export function chomp(line) {
  const match = NEWLINE_EXP.exec(line);
  if (!match) return line;
  return line.slice(0, match.index);
}

/**
 * Simple timer monitor that watches update counts. Once 
 * the counter goes stale and remains the same between
 * ticks of the "interval" we know then the stream is likely idle.
 * 
 * 
 * @param options define interval, done callback and callback to check if should exit.
 */
export function createTimer(options?: IMonitorOptions) {

  options = {
    name: 'anonymous',
    interval: 2500, // ping every 2.5 seconds check update ctr has changed.
    timeout: 15000, // after 15 seconds shut'er down.
    done: () => { },
    onMessage: console.log,
    ...options
  };

  // Timeout has to be longer, maybe change
  // or make more confirable fine for now.
  if (options.timeout <= options.interval)
    options.timeout = options.interval + 1000;

  const { name, interval, until, done, timeout, onMessage } = options;

  let ctr = 0;
  let prevCtr = 0;
  let intervalId;
  let timeoutId;
  let running = false;
  let initialized = false;

  const api = {
    get running() {
      return running;
    },
    update,
    start,
    stop
  };

  // Default take until condition that based on timeout
  // looks for idle output.
  function takeUntil(previous, current) {
    if (until)
      return until(previous, current, intervalId);
    return initialized && current === previous;
  }

  function update() {
    initialized = true;
    ctr += 1;
  }

  function finished() {
    stop();
    done();
  }

  function initTimeout() {
    timeoutId = setTimeout(() => {
      stop();
      onMessage(`${name} timer expired before meeting condition.`);
    }, timeout);
  }

  function start() {
    if (running) return; // already running stop first.
    if (intervalId) clearInterval(intervalId);
    running = true;
    initTimeout();
    intervalId = setInterval(function () {
      if (takeUntil(prevCtr, ctr))
        return finished();
      prevCtr = ctr;
    }, interval);
  }

  function stop() {
    clearInterval(intervalId);
    clearInterval(timeoutId);
    ctr = 0;
    prevCtr = 0;
    running = false;
    initialized = false;
  }

  return api;

}

/**
 * Helper to colorize strings with ansi colors.
 * 
 * @see https://www.npmjs.com/package/ansi-styles
 * 
 * @param str the string to be colorize.
 * @param styles the ansi color styles to be applied.
 */
export function colorize(str: string, ...styles: Color[]) {
  return styles.reduce((result, color) => {
    if (!colors[color])
      return result;
    return colors[color](result);
  }, str);
}

/**
 * Checks if line is a blank line after stripping any ansi styles or line returns.
 * 
 * @param line the line to be inspected.
 */
export function isBlankLine(line: string) {
  const str = stripAnsi(line);
  return !str.replace(NEWLINE_EXP, '').length;
}

/**
 * Strips line of ansi styles.
 * 
 * @see https://www.npmjs.com/package/strip-ansi
 * 
 * @param line the line to be stripped.
 */
function stripAnsi(line: string) {
  return strip(line);
}

/**
 * Escapes a regexp string.
 * 
 * @param str the string to escape.
 */
export function escapeRegex(str: string) {
  return str
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d');
}

/**
 * Pads a string left or right.
 * 
 * @param str the string to be padded.
 * @param dir the direction left or right.
 * @param spaces the amount of padding to apply.
 */
export function pad(str: string, dir: 'left' | 'right', spaces = 0) {
  if (dir === 'left')
    return ' '.repeat(spaces) + str;
  return str + ' '.repeat(spaces);
}


/**
 * Truncates a string.
 * 
 * @param str the string to be inspected or truncated.
 * @param max the maximum length permissible.
 * @param char the trailing char when exceeds length.
 */
export function truncate(str: string, max = 0, char = '...') {
  if (!max || !str)
    return str;
  if (str.length <= max)
    return str;
  return str.substr(0, max - char.length) + char;
}
