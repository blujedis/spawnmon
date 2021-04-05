import { Socket, SocketConstructorOpts } from 'net';
import { PingDispatchEvent } from './types';

/**
 * Creates a socket and pings until connected specified tries are exhausted.
 * 
 * @param host the host ping.
 * @param port the port to ping if any.
 * @param cb a callback on connected.
 */
function pinger(port = 3000, host?: string) {

  host = host || '127.0.0.1';
  port = port || 3000;

  let _tries = 0;
  let _client: Socket;
  let _retries = 0;
  let _canRetry = true;
  let _events = {
    retry: [],
    retried: [],
    connected: [],
    destroyed: []
  };

  const api = {
    get tries() { return _tries; },
    get retries() { return _retries; },
    get client() { return _client; },
    get events() { return _events; },
    destroy,
    on: (event: PingDispatchEvent, handler: (tries?: number, client?: Socket) => void) => {
      _events[event].push(handler);
      return api;
    },
    connect
  };

  function destroy() {
    _retries = 0;
    _tries = 0;
    _canRetry = true; // so if called again can start.
    if (_client)
      _client.destroy();
    dispatch('destroyed');
  }

  function dispatch(event: PingDispatchEvent) {
    if (_events[event].length)
      _events[event].forEach((handler => handler(_tries, _client)));
  }

  async function connect(options: SocketConstructorOpts & { retries?: number, delay?: number } = {}) {

    // iterated through next iteration is zero so exit.
    if (_canRetry === false)
      return;

    // if is undefined set the default.
    options.retries = options.retries || 5;
    options.delay = typeof options.delay === 'undefined' ? 1200 : options.delay;

    const { retries, delay, ...rest } = options;

    _retries = retries;
    _tries += 1;
    dispatch('retry');

    _client = new Socket(rest);

    _client.connect({ host, port }, () => {
      _client.end();
      dispatch('connected');
    });

    _client.on('error', (err) => {
      dispatch('retried');
      // can't continue retries exhaused.
      if (_canRetry && _tries === _retries)
        return destroy();
      // Restart with the original options.
      setTimeout(() => {
        connect(options);
      }, delay);
    });

  }

  return api;


}

export default pinger;